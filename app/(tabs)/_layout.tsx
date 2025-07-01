import { Tabs } from 'expo-router';
import { Lightbulb, FileText } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          paddingHorizontal: 8,
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'New Idea',
          tabBarIcon: ({ size, color }) => (
            <Lightbulb size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'My Ideas',
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}