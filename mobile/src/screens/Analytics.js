import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { CartesianChart, Line, Scatter } from 'victory-native';
import { theme } from '../theme';

const GET_WORKOUTS = gql`
  query GetWorkouts {
    workouts {
      id
      date
      exercises {
        sets {
          reps
          weight
        }
      }
    }
  }
`;

export default function AnalyticsScreen() {
    const { data, loading, refetch } = useQuery(GET_WORKOUTS);
    const workouts = data?.workouts || [];

    const chartData = useMemo(() => {
        return workouts.map((w, index) => {
            const volume = w.exercises.reduce((acc, ex) => {
                const exVolume = ex.sets.reduce((sAcc, s) => sAcc + (s.reps * s.weight), 0);
                return acc + exVolume;
            }, 0);
            return { x: index + 1, y: volume };
        }).reverse(); // Most recent last for chart
    }, [workouts]);

    const totalWorkouts = workouts.length;
    const totalVolume = chartData.reduce((acc, d) => acc + (d.y || 0), 0);
    const avgVolume = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;
    const bestVolume = chartData.reduce((max, d) => Math.max(max, d.y || 0), 0);
    const lastVolume = chartData.length > 0 ? Math.round(chartData[chartData.length - 1].y) : 0;

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={refetch}
                    tintColor={theme.colors.primary}
                />
            }
        >
            <Text style={styles.title}>Total Volume Progress</Text>
            <View style={styles.statsRow}>
                <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Last</Text>
                    <Text style={styles.statValue}>{lastVolume} kg</Text>
                </View>
                <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Avg</Text>
                    <Text style={styles.statValue}>{avgVolume} kg</Text>
                </View>
                <View style={styles.statPill}>
                    <Text style={styles.statLabel}>Best</Text>
                    <Text style={styles.statValue}>{Math.round(bestVolume)} kg</Text>
                </View>
            </View>
            <View style={styles.chartContainer}>
                {chartData.length > 1 ? (
                    <View style={styles.chartArea}>
                        <View style={styles.grid}>
                            <View style={styles.gridRow} />
                            <View style={styles.gridRow} />
                            <View style={styles.gridRow} />
                        </View>
                        <CartesianChart data={chartData} xKey="x" yKeys={["y"]}>
                            {({ points }) => (
                                <>
                                    <Line
                                        points={points.y}
                                        color={theme.colors.primary}
                                        strokeWidth={3}
                                    />
                                    <Scatter
                                        points={points.y}
                                        color={theme.colors.primary}
                                        radius={3}
                                    />
                                </>
                            )}
                        </CartesianChart>
                    </View>
                ) : (
                    <View style={styles.placeholderChart}>
                        <Text style={styles.placeholderText}>Log more workouts to see progress!</Text>
                    </View>
                )}
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Workouts</Text>
                    <Text style={styles.statValue}>{workouts.length}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Avg Volume</Text>
                    <Text style={styles.statValue}>
                        {workouts.length > 0
                            ? Math.round(chartData.reduce((acc, d) => acc + d.y, 0) / workouts.length)
                            : 0} kg
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.md,
    },
    title: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
    },
    chartContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartArea: {
        height: 250,
        width: '100%',
    },
    grid: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    gridRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    statPill: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: theme.borderRadius.md,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        width: '32%',
        alignItems: 'center',
    },
    statLabel: {
        color: theme.colors.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    placeholderChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: theme.colors.textMuted,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.lg,
    },
    statBox: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        width: '48%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statLabel: {
        color: theme.colors.textMuted,
        fontSize: 14,
    },
    statValue: {
        color: theme.colors.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    text: {
        color: theme.colors.text,
    }
});
