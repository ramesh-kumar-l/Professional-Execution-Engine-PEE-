import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/auth-context';
import { RemoteClient } from '../api/remote-client';
import { useStore } from '../db/store-context';
import { LocalGoalRow, LocalTaskRow } from '../db/types';
import { RootStackParamList } from '../navigation/root-navigator';
import { AiSuggestionsPanel } from '../components/AiSuggestionsPanel';

type Route = RouteProp<RootStackParamList, 'GoalDetail'>;

/** Mirrors apps/desktop's GoalDetail.tsx — goals+tasks for one project, Start/Complete buttons,
 *  embeds AiSuggestionsPanel. Execution start/complete is online-only (RemoteClient), matching
 *  the same scope boundary apps/desktop draws. */
export function GoalDetailScreen(): React.JSX.Element {
  const { params } = useRoute<Route>();
  const { store, ready } = useStore();
  const { user, session } = useAuth();
  const remote = React.useMemo(() => new RemoteClient(session), [session]);

  const [goals, setGoals] = useState<LocalGoalRow[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<LocalTaskRow[]>([]);
  const [goalTitle, setGoalTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');

  const refreshGoals = useCallback(async () => {
    if (!store) return;
    setGoals(await store.goals.listByProject(params.projectId));
  }, [store, params.projectId]);

  const refreshTasks = useCallback(
    async (goalId: string) => {
      if (!store) return;
      setTasks(await store.tasks.listByGoal(goalId));
    },
    [store],
  );

  useEffect(() => {
    if (ready) refreshGoals();
  }, [ready, refreshGoals]);

  useEffect(() => {
    if (selectedGoalId) refreshTasks(selectedGoalId);
  }, [selectedGoalId, refreshTasks]);

  async function handleCreateGoal(): Promise<void> {
    if (!store || !user || !goalTitle.trim()) return;
    await store.createGoal(user.id, { projectId: params.projectId, title: goalTitle });
    setGoalTitle('');
    refreshGoals();
  }

  async function handleCreateTask(): Promise<void> {
    if (!store || !user || !selectedGoalId || !taskTitle.trim()) return;
    await store.createTask(user.id, { goalId: selectedGoalId, title: taskTitle });
    setTaskTitle('');
    refreshTasks(selectedGoalId);
  }

  async function handleStart(taskId: string): Promise<void> {
    await remote.startTaskExecution(taskId);
    if (selectedGoalId) refreshTasks(selectedGoalId);
  }

  async function handleComplete(taskId: string): Promise<void> {
    await remote.completeTaskExecution(taskId);
    if (selectedGoalId) refreshTasks(selectedGoalId);
  }

  return (
    <View className="flex-1 gap-4 p-6">
      <View className="flex-row gap-2">
        <TextInput
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="New goal title"
          className="flex-1 rounded border border-gray-300 p-3 text-black dark:border-gray-600 dark:text-white"
        />
        <Pressable onPress={handleCreateGoal} className="items-center justify-center rounded bg-blue-600 px-4">
          <Text className="font-semibold text-white">Add goal</Text>
        </Pressable>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(goal) => goal.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedGoalId(item.id)} className="py-2">
            <Text className={item.id === selectedGoalId ? 'font-semibold text-black dark:text-white' : 'text-black dark:text-white'}>
              {item.title} ({item.status})
            </Text>
          </Pressable>
        )}
      />

      {selectedGoalId && (
        <View className="flex-1 gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          <View className="flex-row gap-2">
            <TextInput
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="New task title"
              className="flex-1 rounded border border-gray-300 p-3 text-black dark:border-gray-600 dark:text-white"
            />
            <Pressable onPress={handleCreateTask} className="items-center justify-center rounded bg-blue-600 px-4">
              <Text className="font-semibold text-white">Add task</Text>
            </Pressable>
          </View>

          <FlatList
            data={tasks}
            keyExtractor={(task) => task.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between border-b border-gray-200 py-2 dark:border-gray-700">
                <Text className="text-black dark:text-white">
                  {item.title} ({item.status})
                </Text>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => handleStart(item.id)}>
                    <Text className="text-blue-600">Start</Text>
                  </Pressable>
                  <Pressable onPress={() => handleComplete(item.id)}>
                    <Text className="text-blue-600">Complete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />

          <AiSuggestionsPanel goalId={selectedGoalId} remote={remote} onAccepted={() => refreshTasks(selectedGoalId)} />
        </View>
      )}
    </View>
  );
}
