// Firebase configuration and database services
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query,
  where,
  orderBy,
  serverTimestamp,
  connectFirestoreEmulator // Add this for local testing if needed
} from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

// Firebase configuration - using direct values
const firebaseConfig = {
  apiKey: "AIzaSyCWSiegzoR8ZFEhKFpJrHjMu_MjcPbKlbg",
  authDomain: "todo-app-8cffa.firebaseapp.com",
  projectId: "todo-app-8cffa",
  storageBucket: "todo-app-8cffa.firebasestorage.app",
  messagingSenderId: "847547316428",
  appId: "1:847547316428:web:8b0632cdf06384586eea69",
  measurementId: "G-Q5086K7Q6P"
};

// Initialize Firebase with error handling
let app;
let db;
let auth;

try {
  console.log("Initializing Firebase with config:", firebaseConfig);
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // For debugging - log when Firebase is initialized
  console.log("Firebase initialized successfully!");
  
  // Uncomment for local development with Firebase emulator
  // if (window.location.hostname === "localhost") {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   console.log("Connected to Firestore emulator");
  // }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  alert("Failed to initialize Firebase: " + error.message);
}

// Authentication Methods
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get the current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Todo CRUD Operations
export const getTodos = async (userId) => {
  try {
    console.log("Getting todos for user:", userId);
    
    if (!userId) {
      console.error("No user ID provided to getTodos");
      return [];
    }
    
    const todosRef = collection(db, 'todos');
    
    // Create a simple query that doesn't rely on serverCreatedAt which might not exist yet
    const q = query(
      todosRef, 
      where('userId', '==', userId)
    );
    
    console.log("Executing Firestore query");
    const querySnapshot = await getDocs(q);
    const todos = [];
    
    querySnapshot.forEach((doc) => {
      try {
        // Get the document data
        const data = doc.data();
        
        // Simple formatting to ensure consistent data structure
        const formattedTodo = {
          id: doc.id,
          ...data,
          text: data.text || '',
          completed: !!data.completed,
          priority: data.priority || 'normal',
          createdAt: data.createdAt || new Date().toISOString(),
          completedAt: data.completedAt || null,
          plannedForTomorrow: !!data.plannedForTomorrow
        };
        
        todos.push(formattedTodo);
      } catch (docError) {
        console.error("Error processing todo document:", docError);
      }
    });
    
    console.log(`Found ${todos.length} todos for user ${userId}`);
    return todos;
  } catch (error) {
    console.error('Error getting todos:', error);
    console.error('Error details:', error.message, error.code);
    alert(`Failed to load tasks: ${error.message}. Please refresh and try again.`);
    return []; // Return empty array instead of throwing to prevent app crashes
  }
};

export const addTodo = async (todo, userId) => {
  try {
    console.log("Adding todo with data:", todo);
    
    if (!userId) {
      console.error("No user ID provided to addTodo");
      alert("You must be logged in to add tasks.");
      throw new Error("User ID is required");
    }
    
    // Create a simpler todo object with the basic required fields
    const todoToAdd = {
      text: todo.text || '',
      completed: false,
      priority: todo.priority || 'normal',
      createdAt: new Date().toISOString(),
      completedAt: null,
      plannedForTomorrow: false,
      userId: userId
    };
    
    console.log("Prepared todo data:", todoToAdd);
    
    const docRef = await addDoc(collection(db, 'todos'), todoToAdd);
    console.log("Todo added with ID:", docRef.id);
    
    return {
      id: docRef.id,
      ...todoToAdd
    };
  } catch (error) {
    console.error('Error adding todo:', error);
    console.error('Error details:', error.message, error.code);
    alert(`Failed to add task: ${error.message}`);
    throw error;
  }
};

export const updateTodo = async (todoId, updatedData) => {
  try {
    console.log("Updating todo:", todoId, "with data:", updatedData);
    
    if (!todoId) {
      console.error("No todo ID provided to updateTodo");
      throw new Error("Todo ID is required");
    }
    
    const todoRef = doc(db, 'todos', todoId);
    
    // Handle completion status specially
    if (updatedData.hasOwnProperty('completed')) {
      updatedData.completedAt = updatedData.completed ? new Date().toISOString() : null;
    }
    
    console.log("Updating with data:", updatedData);
    await updateDoc(todoRef, updatedData);
    
    console.log("Todo updated successfully");
    return {
      id: todoId,
      ...updatedData
    };
  } catch (error) {
    console.error('Error updating todo:', error);
    console.error('Error details:', error.message, error.code);
    alert(`Failed to update task: ${error.message}`);
    throw error;
  }
};

export const deleteTodo = async (todoId) => {
  try {
    console.log("Deleting todo:", todoId);
    
    if (!todoId) {
      console.error("No todo ID provided to deleteTodo");
      throw new Error("Todo ID is required");
    }
    
    const todoRef = doc(db, 'todos', todoId);
    await deleteDoc(todoRef);
    
    console.log("Todo deleted successfully");
    return todoId;
  } catch (error) {
    console.error('Error deleting todo:', error);
    console.error('Error details:', error.message, error.code);
    alert(`Failed to delete task: ${error.message}`);
    throw error;
  }
};

export { auth, db }; 