import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Plus, Check, Trash2, Pencil } from 'lucide-react-native';
import { theme } from '../theme';
import RestTimer from '../components/RestTimer';

const GET_EXERCISES = gql`
  query GetExercises {
    exercises {
      id
      name
      category
    }
  }
`;

const GET_WORKOUTS = gql`
  query GetWorkouts {
    workouts {
      id
      date
      exercises {
        exerciseId
        exercise {
          id
          name
          category
        }
        sets {
          reps
          weight
        }
      }
    }
  }
`;

const LOG_WORKOUT = gql`
  mutation LogWorkout($exercises: [WorkoutExerciseInput!]!) {
    logWorkout(exercises: $exercises) {
      id
      date
      exercises {
        exerciseId
        exercise {
          id
          name
          category
        }
        sets {
          reps
          weight
        }
      }
    }
  }
`;

const ADD_EXERCISE = gql`
  mutation AddExercise($name: String!, $category: String!) {
    addExercise(name: $name, category: $category) {
      id
      name
      category
    }
  }
`;

const UPDATE_EXERCISE = gql`
  mutation UpdateExercise($id: ID!, $name: String!, $category: String!) {
    updateExercise(id: $id, name: $name, category: $category) {
      id
      name
      category
    }
  }
`;

const DELETE_EXERCISE = gql`
  mutation DeleteExercise($id: ID!) {
    deleteExercise(id: $id) {
      id
      name
      category
    }
  }
`;

export default function WorkoutSession({ navigation, route }) {
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseCategory, setNewExerciseCategory] = useState('');
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [editingExerciseId, setEditingExerciseId] = useState(null);
    const [isEditingExercise, setIsEditingExercise] = useState(false);

    const { data, loading, refetch } = useQuery(GET_EXERCISES);
    const [logWorkout] = useMutation(LOG_WORKOUT);
    const [addExercise] = useMutation(ADD_EXERCISE);
    const [updateExercise] = useMutation(UPDATE_EXERCISE);
    const [deleteExercise] = useMutation(DELETE_EXERCISE);

    useEffect(() => {
        if (route?.params?.openExerciseModal) {
            setShowExerciseModal(true);
            navigation.setParams({ openExerciseModal: false });
        }
    }, [route?.params?.openExerciseModal, navigation]);

    const addSet = (exerciseId) => {
        setSelectedExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                return { ...ex, sets: [...ex.sets, { reps: '10', weight: '0' }] };
            }
            return ex;
        }));
        setShowTimer(true);
    };

    const updateSet = (exerciseId, index, field, value) => {
        setSelectedExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                const newSets = [...ex.sets];
                newSets[index] = { ...newSets[index], [field]: value };
                return { ...ex, sets: newSets };
            }
            return ex;
        }));
    };

    const finishWorkout = async () => {
        if (selectedExercises.length === 0) return;

        try {
            const workoutData = selectedExercises.map(ex => ({
                exerciseId: ex.id,
                sets: ex.sets.map(s => ({
                    reps: parseInt(s.reps),
                    weight: parseFloat(s.weight)
                }))
            }));

            const optimisticWorkout = {
                __typename: 'Workout',
                id: `temp-${Date.now()}`,
                date: new Date().toISOString(),
                exercises: selectedExercises.map((ex) => ({
                    __typename: 'WorkoutExercise',
                    exerciseId: ex.id,
                    exercise: {
                        __typename: 'Exercise',
                        id: ex.id,
                        name: ex.name,
                        category: ex.category,
                    },
                    sets: ex.sets.map((s) => ({
                        __typename: 'Set',
                        reps: parseInt(s.reps),
                        weight: parseFloat(s.weight),
                    })),
                })),
            };

            await logWorkout({
                variables: { exercises: workoutData },
                optimisticResponse: { logWorkout: optimisticWorkout },
                update: (cache, { data: mutationData }) => {
                    const newWorkout = mutationData?.logWorkout;
                    if (!newWorkout) return;
                    try {
                        const existing = cache.readQuery({ query: GET_WORKOUTS });
                        if (!existing?.workouts) return;
                        cache.writeQuery({
                            query: GET_WORKOUTS,
                            data: { workouts: [...existing.workouts, newWorkout] },
                        });
                    } catch (_) {
                        // No workouts query in cache yet.
                    }
                },
            });
            Alert.alert('Success', 'Workout logged successfully!');
            navigation.navigate('Home');
        } catch (e) {
            const message = String(e?.message || '');
            if (message.toLowerCase().includes('network request failed')) {
                Alert.alert(
                    'Network error',
                    'Could not reach the backend. Ensure the server is running and the app can reach it.'
                );
            } else {
                Alert.alert('Error', message || 'Unknown error');
            }
        }
    };

    const handleAddExercise = async () => {
        const name = newExerciseName.trim();
        const category = newExerciseCategory.trim();
        if (!name || !category) {
            Alert.alert('Missing info', 'Please enter name and category.');
            return;
        }

        try {
            setIsAddingExercise(true);
            const result = await addExercise({ variables: { name, category } });
            const created = result?.data?.addExercise;
            if (created) {
                setSelectedExercises(prev => [...prev, { ...created, sets: [] }]);
            }
            setNewExerciseName('');
            setNewExerciseCategory('');
            setEditingExerciseId(null);
            await refetch();
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setIsAddingExercise(false);
        }
    };

    const handleEditExercise = async () => {
        const name = newExerciseName.trim();
        const category = newExerciseCategory.trim();
        if (!name || !category || !editingExerciseId) {
            Alert.alert('Missing info', 'Please enter name and category.');
            return;
        }

        try {
            setIsEditingExercise(true);
            const result = await updateExercise({
                variables: { id: editingExerciseId, name, category },
            });
            const updated = result?.data?.updateExercise;
            if (updated) {
                setSelectedExercises(prev =>
                    prev.map(ex => (ex.id === updated.id ? { ...ex, ...updated } : ex))
                );
            }
            setNewExerciseName('');
            setNewExerciseCategory('');
            setEditingExerciseId(null);
            await refetch();
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setIsEditingExercise(false);
        }
    };

    const confirmDeleteExercise = (exerciseId) => {
        Alert.alert('Delete exercise', 'This will remove it from the list.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => handleDeleteExercise(exerciseId),
            },
        ]);
    };

    const handleDeleteExercise = async (exerciseId) => {
        try {
            await deleteExercise({ variables: { id: exerciseId } });
            setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
            if (editingExerciseId === exerciseId) {
                setEditingExerciseId(null);
                setNewExerciseName('');
                setNewExerciseCategory('');
            }
            await refetch();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    return (
        <View style={styles.container}>
            {showTimer && <RestTimer onComplete={() => setShowTimer(false)} />}

            <FlatList
                data={selectedExercises}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.exerciseCard}>
                        <Text style={styles.exerciseName}>{item.name}</Text>
                        {item.sets.map((set, index) => (
                            <View key={index} style={styles.setRow}>
                                <Text style={styles.setText}>Set {index + 1}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={set.weight}
                                    keyboardType="numeric"
                                    onChangeText={(v) => updateSet(item.id, index, 'weight', v)}
                                    placeholder="kg"
                                    placeholderTextColor={theme.colors.textMuted}
                                />
                                <Text style={styles.setLabel}>kg</Text>
                                <TextInput
                                    style={styles.input}
                                    value={set.reps}
                                    keyboardType="numeric"
                                    onChangeText={(v) => updateSet(item.id, index, 'reps', v)}
                                    placeholder="reps"
                                    placeholderTextColor={theme.colors.textMuted}
                                />
                                <Text style={styles.setLabel}>reps</Text>
                                <TouchableOpacity onPress={() => {
                                    const newSelected = [...selectedExercises];
                                    const ex = newSelected.find(e => e.id === item.id);
                                    ex.sets.splice(index, 1);
                                    setSelectedExercises(newSelected);
                                }}>
                                    <Trash2 size={16} color={theme.colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(item.id)}>
                            <Plus size={16} color={theme.colors.primary} />
                            <Text style={styles.addSetText}>Add Set</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListFooterComponent={
                    <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowExerciseModal(true)}>
                        <Plus size={20} color={theme.colors.primary} />
                        <Text style={styles.addExerciseTxt}>Add To Workout</Text>
                    </TouchableOpacity>
                }
            />

            <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
                <Check size={24} color="#FFF" />
                <Text style={styles.finishTxt}>Finish Workout</Text>
            </TouchableOpacity>

            <Modal visible={showExerciseModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Exercise</Text>
                        <View style={styles.newExerciseForm}>
                            <Text style={styles.newExerciseTitle}>
                                {editingExerciseId ? 'Edit exercise' : 'Add new exercise'}
                            </Text>
                            <TextInput
                                style={styles.newExerciseInput}
                                value={newExerciseName}
                                onChangeText={setNewExerciseName}
                                placeholder="Exercise name"
                                placeholderTextColor={theme.colors.textMuted}
                            />
                            <TextInput
                                style={styles.newExerciseInput}
                                value={newExerciseCategory}
                                onChangeText={setNewExerciseCategory}
                                placeholder="Category (e.g. Chest)"
                                placeholderTextColor={theme.colors.textMuted}
                            />
                            <TouchableOpacity
                                style={styles.addNewExerciseBtn}
                                onPress={editingExerciseId ? handleEditExercise : handleAddExercise}
                                disabled={isAddingExercise || isEditingExercise}
                            >
                                <Text style={styles.addNewExerciseTxt}>
                                    {editingExerciseId
                                        ? (isEditingExercise ? 'Saving...' : 'Save Changes')
                                        : (isAddingExercise ? 'Adding...' : 'Add Exercise')}
                                </Text>
                            </TouchableOpacity>
                            {editingExerciseId ? (
                                <TouchableOpacity
                                    style={styles.cancelEditBtn}
                                    onPress={() => {
                                        setEditingExerciseId(null);
                                        setNewExerciseName('');
                                        setNewExerciseCategory('');
                                    }}
                                >
                                    <Text style={styles.cancelEditTxt}>Cancel edit</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <FlatList
                            data={data?.exercises || []}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.exerciseItem}>
                                    <TouchableOpacity
                                        style={styles.exerciseInfo}
                                        onPress={() => {
                                            setSelectedExercises(prev => [...prev, { ...item, sets: [] }]);
                                            setShowExerciseModal(false);
                                        }}
                                    >
                                        <Text style={styles.exerciseItemText}>{item.name}</Text>
                                        <Text style={styles.exerciseItemCat}>{item.category}</Text>
                                    </TouchableOpacity>
                                    <View style={styles.exerciseActions}>
                                        <TouchableOpacity
                                            style={styles.iconBtn}
                                            onPress={() => {
                                                setEditingExerciseId(item.id);
                                                setNewExerciseName(item.name);
                                                setNewExerciseCategory(item.category);
                                            }}
                                        >
                                            <Pencil size={16} color={theme.colors.textMuted} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.iconBtn}
                                            onPress={() => confirmDeleteExercise(item.id)}
                                        >
                                            <Trash2 size={16} color={theme.colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                        <TouchableOpacity style={styles.closeModal} onPress={() => setShowExerciseModal(false)}>
                            <Text style={styles.closeModalText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.md,
    },
    exerciseCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    exerciseName: {
        color: theme.colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    setText: {
        color: theme.colors.text,
        width: 50,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: theme.colors.text,
        padding: 8,
        borderRadius: 8,
        width: 60,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    setLabel: {
        color: theme.colors.textMuted,
        width: 35,
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        padding: theme.spacing.xs,
    },
    addSetText: {
        color: theme.colors.primary,
        marginLeft: 8,
    },
    addExerciseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        borderRadius: theme.borderRadius.lg,
        marginBottom: 80,
    },
    addExerciseTxt: {
        color: theme.colors.primary,
        fontSize: 16,
        marginLeft: 10,
    },
    finishBtn: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: theme.colors.success,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    finishTxt: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    newExerciseForm: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.md,
    },
    newExerciseTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: theme.spacing.sm,
    },
    newExerciseInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: theme.colors.text,
        padding: 10,
        borderRadius: 8,
        marginBottom: theme.spacing.sm,
    },
    addNewExerciseBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
    },
    addNewExerciseTxt: {
        color: '#0B1220',
        fontWeight: 'bold',
    },
    cancelEditBtn: {
        marginTop: theme.spacing.sm,
        alignItems: 'center',
    },
    cancelEditTxt: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    exerciseItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    exerciseInfo: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    exerciseActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: 6,
        marginLeft: 8,
    },
    exerciseItemText: {
        color: theme.colors.text,
        fontSize: 18,
    },
    exerciseItemCat: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    closeModal: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
    },
    closeModalText: {
        color: theme.colors.danger,
        fontSize: 16,
    }
});
