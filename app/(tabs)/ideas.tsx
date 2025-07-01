import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Calendar, Hash, RefreshCw, FileCheck, CircleAlert as AlertCircle } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Idea {
  title: string;
  description: string;
  date: string;
  batchNumber: number;
  script: string;
  flag: 'Complete' | 'Incomplete';
}

export default function IdeasScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshButtonLoading, setIsRefreshButtonLoading] = useState(false);
  
  const refreshRotation = useSharedValue(0);

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

  const onRefreshButtonPress = async () => {
    setIsRefreshButtonLoading(true);
    
    // Animate refresh button - compatible with older versions
    refreshRotation.value = withTiming(refreshRotation.value + 360, { duration: 500 });
    
    await fetchIdeas();
    setIsRefreshButtonLoading(false);
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

  const animatedRefreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshRotation.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={24} color="#22c55e" />
          <Text style={styles.headerTitle}>My Ideas</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, isRefreshButtonLoading && styles.refreshButtonDisabled]}
          onPress={onRefreshButtonPress}
          disabled={isRefreshButtonLoading}
          activeOpacity={0.7}
        >
          <Animated.View style={animatedRefreshStyle}>
            <RefreshCw size={20} color="#22c55e" />
          </Animated.View>
        </TouchableOpacity>
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
                    <View style={styles.metaItem}>
                      {idea.flag === 'Complete' ? (
                        <FileCheck size={12} color="#22c55e" />
                      ) : (
                        <AlertCircle size={12} color="#f59e0b" />
                      )}
                      <Text style={[
                        styles.metaText,
                        idea.flag === 'Complete' ? styles.completeText : styles.incompleteText
                      ]}>
                        {idea.flag}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.ideaDescription} numberOfLines={3}>
                  {idea.description}
                </Text>
                
                {idea.script && (
                  <View style={styles.scriptContainer}>
                    <Text style={styles.scriptLabel}>Script</Text>
                    <Text style={styles.scriptText} numberOfLines={4}>
                      {idea.script}
                    </Text>
                  </View>
                )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  refreshButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  refreshButtonDisabled: {
    opacity: 0.6,
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
    flexWrap: 'wrap',
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
  completeText: {
    color: '#22c55e',
  },
  incompleteText: {
    color: '#f59e0b',
  },
  ideaDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  scriptContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  scriptLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#22c55e',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scriptText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#e5e5e5',
    lineHeight: 18,
  },
});