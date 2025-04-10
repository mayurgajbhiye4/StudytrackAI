import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ListChecks, GraduationCap, Plus } from 'lucide-react';
import { useTaskContext } from '@/contexts/TaskContext';
import PageTransition from '@/components/layout/PageTransition';
import TaskItem from '@/components/ui-custom/TaskItem';
import GoalProgress from '@/components/ui-custom/GoalProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Development = () => {
  const { 
    getTasksByCategory, 
    addTask, 
    toggleTask, 
    editTask, 
    deleteTask,
    getCompletedTasksCount,
    getTotalTasksCount,
    getWeeklyStreak
  } = useTaskContext();
  
  const [newTask, setNewTask] = useState('');
  
  const devTasks = getTasksByCategory('development');
  const completedTasks = devTasks.filter(task => task.completed);
  const incompleteTasks = devTasks.filter(task => !task.completed);
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(newTask, 'development');
      setNewTask('');
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center">
              <Badge variant="outline" className="mb-2 border-category-development text-category-development bg-category-development/5">
                Study Tracker
              </Badge>
            </div>
            <h1 className="text-3xl font-bold flex items-center">
              <BookOpen className="mr-2 h-7 w-7 text-category-development" />
              Software Development
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your development projects, features, and learning progress.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <ListChecks className="mr-2 h-5 w-5" />
                  Development Tasks
                </CardTitle>
                <CardDescription>
                  Keep track of features, bugs, and learning goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTask} className="mb-6">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="new-task-input"
                        placeholder="Add a new development task or feature..."
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
              categoryName="Development"
              color="#10B981"
              dailyGoal={3}
              completed={getCompletedTasksCount('development')}
              weeklyStreak={getWeeklyStreak('development')}
            />
            
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Dev Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Consistent Commits</h4>
                  <p className="text-muted-foreground">Aim for at least one meaningful commit daily to build a strong GitHub profile.</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Project Management</h4>
                  <p className="text-muted-foreground">Break down large features into smaller, manageable tasks with clear acceptance criteria.</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Learning Strategy</h4>
                  <p className="text-muted-foreground">Balance 70% practical coding with 30% theoretical learning for optimal skill development.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Development;
