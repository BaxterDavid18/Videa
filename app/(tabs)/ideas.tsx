import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Calendar, Hash, RefreshCw, FileCheck, CircleAlert as AlertCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  // State to manage which script is expanded (using index)
  const [expandedScriptIndex, setExpandedScriptIndex] = useState<number | null>(null);

  const refreshRotation = useSharedValue(0);

  const fetchIdeas = async () => {
    try {
      console.log('Frontend: Fetching ideas from API...');
      const response = await fetch('/api/get-ideas');
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend: API Response:', data);
        console.log('Frontend: Ideas received:', data.ideas);
        setIdeas(data.ideas || []);
      } else {
        console.error('Frontend: Failed to fetch ideas - response not ok:', response.status);
      }
    } catch (error) {
      console.error('Frontend: Failed to fetch ideas:', error);
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

  // Modified copyScriptToClipboard function to use web clipboard API for web,
  // and a fallback for native (though expo-clipboard is recommended for native)
  const copyScriptToClipboard = async (script: string, title: string) => {
    try {
      if (script && script.trim() !== '') {
        if (Platform.OS === 'web') {
          // Web-specific clipboard functionality
          const textarea = document.createElement('textarea');
          textarea.value = script;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          Alert.alert('Copied!', `Script for "${title}" has been copied to clipboard.`);
        } else {
          // Fallback for native, if expo-clipboard is not used.
          // For a production native app, expo-clipboard.setStringAsync() is the correct way.
          // This alert is a placeholder for native functionality without expo-clipboard.
          Alert.alert('Copy Functionality', 'Clipboard functionality for native is not implemented without expo-clipboard.');
          // If you decide to re-add expo-clipboard for native, uncomment the original line:
          // await Clipboard.setStringAsync(script);
        }
      } else {
        Alert.alert('No Content', 'There is no script content to copy.');
      }
    } catch (error) {
      console.error('Frontend: Failed to copy script:', error);
      Alert.alert('Error', 'Failed to copy script to clipboard.');
    }
  };

  // Toggle script expansion for a specific idea
  const toggleScriptExpansion = (index: number) => {
    setExpandedScriptIndex(expandedScriptIndex === index ? null : index);
  };

  // Function to update the flag status
  const updateIdeaFlag = async (batchNumber: number, newFlag: 'Complete' | 'Incomplete') => {
    console.log(`Frontend: updateIdeaFlag called for batchNumber: ${batchNumber}, newFlag: ${newFlag}`);
    try {
      console.log(`Frontend: Sending PUT request to /api/update-idea-flag with batchNumber: ${batchNumber}, newFlag: ${newFlag}`);
      const response = await fetch('/api/update-idea-flag', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchNumber, newFlag }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Frontend: Flag update successful:', result);
        Alert.alert('Success', `Idea ${batchNumber} marked as ${newFlag}.`);
        // Refresh ideas to show updated status
        await fetchIdeas();
      } else {
        const errorData = await response.json();
        console.error('Frontend: Flag update failed - response not ok:', response.status, errorData);
        Alert.alert('Error', `Failed to update flag: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Frontend: Error updating idea flag:', error);
      Alert.alert('Error', 'Failed to update flag due to network or server issue.');
    }
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
            {ideas.map((idea, index) => {
              const isScriptExpanded = expandedScriptIndex === index;
              console.log(`Rendering idea ${index}:`, {
                title: idea.title,
                script: idea.script,
                scriptLength: idea.script?.length,
                flag: idea.flag,
                isExpanded: isScriptExpanded
              });

              return (
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

                  {/* Description section with bold label */}
                  <Text style={styles.descriptionDisplay}>
                    <Text style={styles.descriptionDisplayLabel}>Description: </Text>
                    {idea.description}
                  </Text>

                  {/* Divider before script */}
                  <View style={styles.divider} />

                  {/* Script section with dropdown */}
                  <TouchableOpacity
                    style={styles.scriptDropdownHeader}
                    onPress={() => toggleScriptExpansion(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.scriptDisplayLabel}>Script</Text>
                    {isScriptExpanded ? (
                      <ChevronUp size={20} color="#22c55e" />
                    ) : (
                      <ChevronDown size={20} color="#22c55e" />
                    )}
                  </TouchableOpacity>

                  {isScriptExpanded && (
                    <Text style={styles.scriptDisplay}>
                      {idea.script && idea.script.trim() !== '' ? idea.script : 'No content available'}
                    </Text>
                  )}

                  {/* Copy button - Centered */}
                  {idea.script && idea.script.trim() !== '' && (
                    <TouchableOpacity
                      style={styles.copyButtonCentered}
                      onPress={() => copyScriptToClipboard(idea.script, idea.title)}
                      activeOpacity={0.8}
                    >
                      <Copy size={16} color="#ffffff" />
                      <Text style={styles.copyButtonText}>Copy Script</Text>
                    </TouchableOpacity>
                  )}

                  {/* Mark as Complete/Incomplete buttons */}
                  <View style={styles.flagButtonsContainer}>
                    {idea.flag === 'Incomplete' ? (
                      <TouchableOpacity
                        style={[styles.flagButton, styles.markCompleteButton]}
                        onPress={() => updateIdeaFlag(idea.batchNumber, 'Complete')}
                        activeOpacity={0.8}
                      >
                        <FileCheck size={16} color="#ffffff" />
                        <Text style={styles.flagButtonText}>Mark as Complete</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.flagButton, styles.markIncompleteButton]}
                        onPress={() => updateIdeaFlag(idea.batchNumber, 'Incomplete')}
                        activeOpacity={0.8}
                      >
                        <AlertCircle size={16} color="#ffffff" />
                        <Text style={styles.flagButtonText}>Mark as Incomplete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
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
  // Updated description display styles
  descriptionDisplay: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  descriptionDisplayLabel: {
    fontFamily: 'Inter-SemiBold',
    color: '#e5e5e5',
  },
  // New styles for script display
  scriptDisplay: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  scriptDisplayLabel: {
    fontFamily: 'Inter-SemiBold',
    color: '#e5e5e5',
  },
  // Centered copy button style
  copyButtonCentered: {
    backgroundColor: '#22c55e',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 8,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  // New divider style
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
    borderRadius: 0.5,
  },
  // New styles for script dropdown header
  scriptDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  // Styles for the new flag buttons
  flagButtonsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  markCompleteButton: {
    backgroundColor: '#22c55e',
    borderColor: '#1a9e4e',
  },
  markIncompleteButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#cc8200',
  },
  flagButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});