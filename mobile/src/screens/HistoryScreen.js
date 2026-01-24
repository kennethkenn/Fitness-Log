import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@apollo/client/react';
import { useFocusEffect } from '@react-navigation/native';
import { gql } from '@apollo/client';
import { Calendar } from 'lucide-react-native';
import { theme } from '../theme';

const GET_WORKOUTS = gql`
  query GetWorkouts {
    workouts {
      id
      date
      exercises {
        exercise {
          name
        }
        sets {
          reps
          weight
        }
      }
    }
  }
`;

export default function HistoryScreen() {
    const { data, loading, refetch } = useQuery(GET_WORKOUTS);

    useFocusEffect(
        React.useCallback(() => {
            refetch();
        }, [refetch])
    );

    if (loading) return <View style={styles.container}><Text style={styles.text}>Loading...</Text></View>;

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getWorkoutVolume = (workout) => {
        return workout.exercises.reduce((acc, ex) => {
            const exVol = ex.sets.reduce((sAcc, s) => sAcc + (s.reps * s.weight), 0);
            return acc + exVol;
        }, 0);
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={data?.workouts || []}
                keyExtractor={item => item.id}
                onRefresh={refetch}
                refreshing={loading}
                renderItem={({ item }) => (
                    <View style={styles.workoutCard}>
                        <View style={styles.cardHeader}>
                            <Calendar size={16} color={theme.colors.primary} />
                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                        </View>
                        {item.exercises.map((ex, idx) => (
                            <View key={idx} style={styles.exerciseInfo}>
                                <Text style={styles.exerciseName}>
                                    {ex.exercise?.name || 'Unknown Exercise'}
                                </Text>
                                <Text style={styles.setsInfo}>
                                    {ex.sets.length} sets - Max {Math.max(...ex.sets.map(s => s.weight))} kg
                                </Text>
                            </View>
                        ))}
                        <View style={styles.cardFooter}>
                            <Text style={styles.footerText}>
                                Total volume: {Math.round(getWorkoutVolume(item))} kg
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        No workouts yet. Start a session and log your first set.
                    </Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.md,
    },
    workoutCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingBottom: theme.spacing.xs,
    },
    dateText: {
        color: theme.colors.text,
        marginLeft: 8,
        fontWeight: 'bold',
    },
    exerciseInfo: {
        marginTop: 8,
    },
    exerciseName: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    setsInfo: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    emptyText: {
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: 40,
    },
    cardFooter: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    footerText: {
        color: theme.colors.textMuted,
        fontSize: 12,
    },
    text: {
        color: theme.colors.text,
    }
});
