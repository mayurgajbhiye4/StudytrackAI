from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions 
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, action
from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from .models import CustomUser,Task, Goal
from .serializers import UserSerializer, LoginSerializer, GoalSerializer, TaskSerializer
from django.views.decorators.http import require_GET
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

# Create your views here.
def home(request):
    return render(request, "index.html")

@require_GET
def csrf_token(request):
    # Generate a new CSRF token (this also sets it in the request session)
    csrf_token = get_token(request)
    # Create the response and explicitly set the CSRF cookie
    response = JsonResponse({'csrfToken': csrf_token})
    
    # Match cookie settings to Django's defaults (adjust if you've customized these)
    response.set_cookie(
        'csrftoken',
        csrf_token, 
        max_age= 31449600,  # 1 year (Django's default)
        secure= settings.CSRF_COOKIE_SECURE,
        httponly= False,  # CSRF tokens are typically accessible via JS
        samesite= settings.CSRF_COOKIE_SAMESITE  # Match your security requirements
    )
    return response

class UserDetailsView(APIView):
    """Get details of the currently authenticated user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Customize this based on your User model fields
        data = {
            'user': {
                'email': user.email,
                'username': user.username,
                'has_profile': hasattr(user, 'profile')
            }
        }
        return Response(data, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get('email')
        password = serializer.validated_data.get('password')

        # First check if user exists
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'No account found with this email'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'Account is not active'},
                status=status.HTTP_403_FORBIDDEN
            )

        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': {
                'email': user.email,
                'username': user.username
            }
        }, status=status.HTTP_200_OK)
    

class SignupView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(email=serializer.validated_data['email']).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if CustomUser.objects.filter(username=serializer.validated_data['username']).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = CustomUser.objects.create_user(
            email=serializer.validated_data['email'],
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )

        return Response({
            'message': 'User created successfully',
            'user': {
                'email': user.email,
                'username': user.username
            }
        }, status=status.HTTP_201_CREATED)
    

class LogoutView(APIView):
    """Handle user logout"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Clear session data
        logout(request)
        # Add additional cleanup if needed
        return Response(
            {'detail': 'Successfully logged out.'},
            status=status.HTTP_200_OK
        )
    

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Task.objects.none()

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related('user')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalViewSet(viewsets.ModelViewSet):   
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only return goals belonging to the current user"""
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Associate the goal with the current user on creation"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_daily_goal_completed(self, request, pk=None):
        """
        Endpoint to mark a daily goal as completed for today
        """
        goal = self.get_object()
        user = request.user
        today = timezone.now().date()
        today_weekday = today.weekday()  # Monday is 0, Sunday is 6
        
        # If this is a new week, reset the days completed
        if goal.last_completed_date:
            last_date = goal.last_completed_date
            # Get the Monday of the last completion week
            last_monday = last_date - timedelta(days=last_date.weekday())
            # Get the Monday of this week
            this_monday = today - timedelta(days=today.weekday())
            
            if this_monday > last_monday:
                # We're in a new week, reset days completed
                goal.current_week_days_completed = []
        
        # If we're marking a new day as completed
        if today_weekday not in goal.current_week_days_completed:
            goal.current_week_days_completed.append(today_weekday)
            goal.last_completed_date = today
            
            # Initialize streak_started_at if this is the first completion
            if not goal.streak_started_at:
                goal.streak_started_at = today
                
            # Update weekly streak if necessary 
            if len(goal.current_week_days_completed) > goal.weekly_streak:
                goal.weekly_streak = len(goal.current_week_days_completed)
                
            goal.save()
            
        return Response({
            'status': 'success',
            'weekly_streak': goal.weekly_streak,
            'current_week_days_completed': goal.current_week_days_completed
        })
    
    @action(detail=False, methods=['post'])
    def update_all_streaks(self, request):
        """
        Endpoint to check and update weekly streaks for all goals
        This would be called by a scheduled job every day (ideally at midnight)
        """
        user = request.user
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Get all goals for the user
        goals = Goal.objects.filter(user=user)
        
        for goal in goals:
            # If we haven't completed yesterday's goal, reset streak
            if goal.last_completed_date != yesterday:
                # Check if we're in a new week 
                if goal.last_completed_date:
                    last_monday = goal.last_completed_date - timedelta(days=goal.last_completed_date.weekday())
                    this_monday = today - timedelta(days=today.weekday()) 
                    
                    if this_monday > last_monday:
                        # We're in a new week, reset the weekly streak data
                        goal.current_week_days_completed = []
                        # We keep the weekly_streak value until the user gets a higher streak this week
            
            goal.save()
            
        return Response({'status': 'streaks checked and updated'}, status=status.HTTP_200_OK)