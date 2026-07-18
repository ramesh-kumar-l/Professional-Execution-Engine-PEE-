import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/auth-context';
import { useStore } from '../db/store-context';
import { LocalProjectRow } from '../db/types';
import { RootStackParamList } from '../navigation/root-navigator';
import { SyncStatusBadge } from '../components/SyncStatusBadge';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Projects'>;

/** Mirrors apps/desktop's Projects.tsx — full local CRUD via MobileStore, no network round trip. */
export function ProjectsScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const { store, ready } = useStore();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<LocalProjectRow[]>([]);
  const [name, setName] = useState('');

  const refresh = useCallback(async () => {
    if (!store || !user) return;
    setProjects(await store.projects.listByOwner(user.id));
  }, [store, user]);

  useEffect(() => {
    if (ready) refresh();
  }, [ready, refresh]);

  async function handleCreate(): Promise<void> {
    if (!store || !user || !name.trim()) return;
    await store.createProject(user.id, { name });
    setName('');
    refresh();
  }

  return (
    <View className="flex-1 gap-4 p-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-black dark:text-white">Welcome, {user?.displayName}</Text>
        <SyncStatusBadge />
      </View>

      <View className="flex-row gap-2">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New project name"
          className="flex-1 rounded border border-gray-300 p-3 text-black dark:border-gray-600 dark:text-white"
          testID="project-name-input"
        />
        <Pressable onPress={handleCreate} className="items-center justify-center rounded bg-blue-600 px-4" testID="project-add">
          <Text className="font-semibold text-white">Add</Text>
        </Pressable>
      </View>

      {projects.length === 0 && <Text className="text-black dark:text-white">No projects yet.</Text>}

      <FlatList
        data={projects}
        keyExtractor={(project) => project.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('GoalDetail', { projectId: item.id })}
            className="flex-row items-center justify-between border-b border-gray-200 py-3 dark:border-gray-700"
          >
            <Text className="text-black dark:text-white">{item.name}</Text>
            <Text className="text-gray-500 dark:text-gray-400">{item.status}</Text>
          </Pressable>
        )}
      />

      <Pressable onPress={() => navigation.navigate('Analytics')} className="items-center rounded border border-gray-300 p-3 dark:border-gray-600">
        <Text className="text-black dark:text-white">Analytics</Text>
      </Pressable>

      <Pressable onPress={logout} className="items-center rounded border border-gray-300 p-3 dark:border-gray-600" testID="logout">
        <Text className="text-black dark:text-white">Log out</Text>
      </Pressable>
    </View>
  );
}
