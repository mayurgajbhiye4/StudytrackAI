import { useState, useEffect } from 'react';
import { Code, ListChecks, GraduationCap } from 'lucide-react'; 
import { useTaskContext } from '@/contexts/TaskContext';
import { useGoalContext } from "@/contexts/GoalContext";
import PageTransition from '@/components/layout/PageTransition';
import TaskItem from '@/components/ui-custom/TaskItem';
import GoalProgress from '@/components/ui-custom/GoalProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

const DSA = () => {
  const { 
    getTasksByCategory, 
    addTask, 
    toggleTask, 
    editTask, 
    deleteTask,
    getCompletedTasksCount,
    getTotalTasksCount,
    getWeeklyData
  } = useTaskContext();

  const { getGoal, updateGoal, loading: goalsLoading } = useGoalContext();
  
  const [newTask, setNewTask] = useState('');
  const [goalInputValue, setGoalInputValue] = useState('3');

  // Get DSA goal from context
  const dsaGoal = getGoal('dsa');
  const dailyGoal = dsaGoal.daily_target;
  const { weeklyStreak, weekdaysCompleted } = getWeeklyData('dsa');

   // Initialize input with current goal value when component mounts or goal changes
  useEffect(() => {
    setGoalInputValue(dailyGoal.toString());
  }, [dailyGoal]);

  const dsaTasks = getTasksByCategory('dsa');
  const completedTasks = dsaTasks.filter(task => task.completed);
  const incompleteTasks = dsaTasks.filter(task => !task.completed);
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask, 'dsa');
      setNewTask('');
    }
  };

  const handleSetDailyGoal = async () => {
    const newGoal = parseInt(goalInputValue);
    if (!isNaN(newGoal) && newGoal > 0) {
      await updateGoal('dsa', newGoal);
    }
  };  


  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center">
              <Badge variant="outline" className="mb-2 border-category-dsa text-category-dsa bg-category-dsa/5">
                Study Tracker     
              </Badge>
            </div>
            <h1 className="text-3xl font-bold flex items-center">
              <Code className="mr-2 h-7 w-7 text-category-dsa" />
              Data Structures & Algorithms
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your DSA practice, LeetCode problems, and study progress.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <ListChecks className="mr-2 h-5 w-5" />
                  DSA Tasks
                </CardTitle>
                <CardDescription>
                  Keep track of problems you're working on
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTask} className="mb-6">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="new-task-input"
                        placeholder="Add a new LeetCode problem or study task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button type="submit" disabled={!newTask.trim()}>
                      Add
                    </Button>
                  </div>
                </form>
                
                <Tabs defaultValue="incomplete" className="w-full">
                  <TabsList className="mb-4 grid grid-cols-2">
                    <TabsTrigger value="incomplete" className="text-sm">
                      In Progress ({incompleteTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-sm">
                      Completed ({completedTasks.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="incomplete" className="mt-0">
                    <div className="space-y-1">
                      {incompleteTasks.length > 0 ? (
                        incompleteTasks.map(task => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onEdit={editTask}
                            onDelete={deleteTask}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                          <p>No tasks in progress. Add one to get started!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="completed" className="mt-0">
                    <div className="space-y-1">
                      {completedTasks.length > 0 ? (
                        completedTasks.map(task => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onEdit={editTask}
                            onDelete={deleteTask}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                          <p>No completed tasks yet. Keep going!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <GoalProgress
              categoryName="DSA"
              color="#3B82F6"
              dailyGoal={dailyGoal}
              completed={getCompletedTasksCount('dsa')}
              weeklyStreak={dsaGoal.weekly_streak || weeklyStreak}
              weekdaysCompleted={dsaGoal.current_week_days_completed || weekdaysCompleted}
              onEditGoal={
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      Set daily goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Set Daily Goal</DialogTitle>
                      <DialogDescription>
                        How many DSA tasks would you like to complete each day?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                      <Input
                        type="number"
                        min="1"
                        value={goalInputValue}
                        onChange={(e) => setGoalInputValue(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button type="button" onClick={handleSetDailyGoal}>
                          Save
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              }
            />
            
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">DSA Study Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Study Pattern</h4>
                  <p className="text-muted-foreground">Focus on one data structure or algorithm concept per week for depth.</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Problem Solving</h4>
                  <p className="text-muted-foreground">Aim to solve at least 3 problems of varying difficulty levels each day.</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Review Strategy</h4>
                  <p className="text-muted-foreground">Revisit solved problems after 7 days to strengthen memory retention.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DSA;
