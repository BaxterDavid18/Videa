import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, Lightbulb } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';

export default function NewIdeaScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const buttonScale = useSharedValue(1);
  const saveIconRotation = useSharedValue(0);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in both title and description fields.');
      return;
    }

    setIsLoading(true);
    
    // Button animation
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    
    saveIconRotation.value = withSpring(360);

    try {
      const response = await fetch('/api/save-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success!', 'Your idea has been saved successfully.', [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setDescription('');
            },
          },
        ]);
      } else {
        throw new Error('Failed to save idea');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save your idea. Please try again.');
    } finally {
      setIsLoading(false);
      saveIconRotation.value = 0;
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${saveIconRotation.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Lightbulb size={32} color="#22c55e" />
              <Text style={styles.appTitle}>VIDEA</Text>
            </View>
            <Text style={styles.subtitle}>Capture your brilliant ideas</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Idea Title</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="What's your brilliant idea?"
                placeholderTextColor="#666666"
                multiline={false}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your idea in detail..."
                placeholderTextColor="#666666"
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>

            <Animated.View style={[styles.saveButtonContainer, animatedButtonStyle]}>
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Animated.View style={animatedIconStyle}>
                  <Save size={20} color="#ffffff" />
                </Animated.View>
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save Idea'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginLeft: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#cccccc',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#22c55e',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#333333',
    minHeight: 56,
  },
  descriptionInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#333333',
    minHeight: 120,
  },
  saveButtonContainer: {
    marginTop: 32,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#166534',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});