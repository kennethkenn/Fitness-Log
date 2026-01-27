const { ApolloServer, gql } = require('apollo-server');
const path = require('path');
const Database = require('better-sqlite3');

const DB_FILE = path.join(__dirname, 'fitness.sqlite');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

const initDb = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workout_exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_id INTEGER NOT NULL,
            exercise_id INTEGER NOT NULL,
            FOREIGN KEY (workout_id) REFERENCES workouts(id),
            FOREIGN KEY (exercise_id) REFERENCES exercises(id)
        );

        CREATE TABLE IF NOT EXISTS workout_sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_exercise_id INTEGER NOT NULL,
            reps INTEGER NOT NULL,
            weight REAL NOT NULL,
            FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id)
        );
    `);

    const count = db.prepare('SELECT COUNT(*) as count FROM exercises').get();
    if (count.count === 0) {
        const insert = db.prepare('INSERT INTO exercises (name, category) VALUES (?, ?)');
        const seed = db.transaction(() => {
            insert.run('Bench Press', 'Chest');
            insert.run('Squat', 'Legs');
            insert.run('Deadlift', 'Back');
            insert.run('Overhead Press', 'Shoulders');
        });
        seed();
    }
};

initDb();

const typeDefs = gql`
  type Exercise {
    id: ID!
    name: String!
    category: String!
  }

  type Set {
    reps: Int!
    weight: Float!
  }

  type WorkoutExercise {
    exerciseId: ID!
    exercise: Exercise!
    sets: [Set!]!
  }

  type Workout {
    id: ID!
    date: String!
    exercises: [WorkoutExercise!]!
  }

  input SetInput {
    reps: Int!
    weight: Float!
  }

  input WorkoutExerciseInput {
    exerciseId: ID!
    sets: [SetInput!]!
  }

  type Query {
    exercises: [Exercise!]!
    workouts: [Workout!]!
    workout(id: ID!): Workout
  }

  type Mutation {
    addExercise(name: String!, category: String!): Exercise!
    updateExercise(id: ID!, name: String!, category: String!): Exercise!
    deleteExercise(id: ID!): Exercise
    logWorkout(exercises: [WorkoutExerciseInput!]!): Workout!
  }
`;

const getWorkoutById = (id) => {
    const workout = db.prepare('SELECT id, date FROM workouts WHERE id = ?').get(id);
    if (!workout) return null;
    return hydrateWorkout(workout);
};

const hydrateWorkout = (workoutRow) => {
    const workoutExercises = db
        .prepare('SELECT id, exercise_id FROM workout_exercises WHERE workout_id = ?')
        .all(workoutRow.id)
        .map((we) => {
            const sets = db
                .prepare('SELECT reps, weight FROM workout_sets WHERE workout_exercise_id = ?')
                .all(we.id)
                .map((s) => ({ reps: s.reps, weight: s.weight }));
            return { exerciseId: String(we.exercise_id), sets };
        });

    return {
        id: String(workoutRow.id),
        date: workoutRow.date,
        exercises: workoutExercises,
    };
};

const resolvers = {
    WorkoutExercise: {
        exercise: (parent) => {
            return db
                .prepare('SELECT id, name, category FROM exercises WHERE id = ?')
                .get(Number(parent.exerciseId));
        },
    },
    Query: {
        exercises: () => db.prepare('SELECT id, name, category FROM exercises').all(),
        workouts: () =>
            db
                .prepare('SELECT id, date FROM workouts ORDER BY id ASC')
                .all()
                .map(hydrateWorkout),
        workout: (_, { id }) => getWorkoutById(Number(id)),
    },
    Mutation: {
        addExercise: (_, { name, category }) => {
            const result = db
                .prepare('INSERT INTO exercises (name, category) VALUES (?, ?)')
                .run(name, category);
            return { id: String(result.lastInsertRowid), name, category };
        },
        updateExercise: (_, { id, name, category }) => {
            db.prepare('UPDATE exercises SET name = ?, category = ? WHERE id = ?').run(
                name,
                category,
                Number(id)
            );
            return { id: String(id), name, category };
        },
        deleteExercise: (_, { id }) => {
            const exercise = db
                .prepare('SELECT id, name, category FROM exercises WHERE id = ?')
                .get(Number(id));
            if (!exercise) return null;

            const deleteTx = db.transaction(() => {
                const workoutExerciseIds = db
                    .prepare('SELECT id FROM workout_exercises WHERE exercise_id = ?')
                    .all(Number(id))
                    .map((row) => row.id);

                for (const weId of workoutExerciseIds) {
                    db.prepare('DELETE FROM workout_sets WHERE workout_exercise_id = ?').run(weId);
                }
                db.prepare('DELETE FROM workout_exercises WHERE exercise_id = ?').run(Number(id));
                db.prepare('DELETE FROM exercises WHERE id = ?').run(Number(id));
            });
            deleteTx();

            return { id: String(exercise.id), name: exercise.name, category: exercise.category };
        },
        logWorkout: (_, { exercises: workoutExercises }) => {
            const now = new Date().toISOString();
            const insertWorkout = db.prepare('INSERT INTO workouts (date) VALUES (?)');
            const insertWorkoutExercise = db.prepare(
                'INSERT INTO workout_exercises (workout_id, exercise_id) VALUES (?, ?)'
            );
            const insertSet = db.prepare(
                'INSERT INTO workout_sets (workout_exercise_id, reps, weight) VALUES (?, ?, ?)'
            );

            const tx = db.transaction(() => {
                const workoutResult = insertWorkout.run(now);
                const workoutId = workoutResult.lastInsertRowid;

                for (const ex of workoutExercises) {
                    const weResult = insertWorkoutExercise.run(
                        workoutId,
                        Number(ex.exerciseId)
                    );
                    const workoutExerciseId = weResult.lastInsertRowid;
                    for (const set of ex.sets) {
                        insertSet.run(workoutExerciseId, set.reps, set.weight);
                    }
                }

                return workoutId;
            });

            const workoutId = tx();
            return getWorkoutById(workoutId);
        },
    },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
