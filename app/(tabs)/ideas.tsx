import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Calendar, Hash } from 'lucide-react-native';

interface Idea {
  title: string;
  description: string;
  date: string;
  batchNumber: number;
}

export default function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/get-ideas');
      if (response.ok) {
        const data = await response.json();
        setIdeas(data.ideas || []);
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIdeas();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <FileText size={24} color="#22c55e" />
        <Text style={styles.headerTitle}>My Ideas</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22c55e"
            colors={['#22c55e']}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your ideas...</Text>
          </View>
        ) : ideas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#666666" />
            <Text style={styles.emptyTitle}>No Ideas Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start capturing your brilliant ideas using the New Idea tab
            </Text>
          </View>
        ) : (
          <View style={styles.ideasContainer}>
            {ideas.map((idea, index) => (
              <View key={index} style={styles.ideaCard}>
                <View style={styles.ideaHeader}>
                  <Text style={styles.ideaTitle} numberOfLines={2}>
                    {idea.title}
                  </Text>
                  <View style={styles.ideaMeta}>
                    <View style={styles.metaItem}>
                      <Hash size={12} color="#22c55e" />
                      <Text style={styles.metaText}>{idea.batchNumber}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Calendar size={12} color="#22c55e" />
                      <Text style={styles.metaText}>{formatDate(idea.date)}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.ideaDescription} numberOfLines={3}>
                  {idea.description}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  ideasContainer: {
    flex: 1,
  },
  ideaCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  ideaHeader: {
    marginBottom: 12,
  },
  ideaTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 22,
  },
  ideaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
  },
  ideaDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
    lineHeight: 20,
  },
});