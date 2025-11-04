// firebase-config.js
// Configuração do Firebase com Autenticação Completa

const firebaseConfig = {
  apiKey: "AIzaSyDtDUaL76tYA5-z5fF_znZpVBHpivazli0",
  authDomain: "relax-app-f0891.firebaseapp.com",
  projectId: "relax-app-f0891",
  storageBucket: "relax-app-f0891.firebasestorage.app",
  messagingSenderId: "765486302219",
  appId: "1:765486302219:web:26843da76888c82448f30e",
  measurementId: "G-TF3BQZCXFW"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Referências das coleções
const typesCollection = db.collection('massage_types');
const appointmentsCollection = db.collection('appointments');
const availabilityCollection = db.collection('availability');
const usersCollection = db.collection('users');

// ====================
// FUNÇÕES DE AUTENTICAÇÃO
// ====================

// Registrar usuário com email e senha
async function registerUser(email, password, name, phone) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    await user.updateProfile({
      displayName: name
    });
    
    await usersCollection.doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      name: name,
      phone: phone,
      createdAt: Date.now()
    });
    
    return user;
  } catch (error) {
    console.error('Erro ao registrar:', error);
    throw error;
  }
}

// Login com email e senha
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

// Login com Google
async function loginWithGoogleProvider() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    
    const userDoc = await usersCollection.doc(user.uid).get();
    if (!userDoc.exists) {
      await usersCollection.doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        name: user.displayName || '',
        phone: '',
        createdAt: Date.now()
      });
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
    throw error;
  }
}

// Logout
async function logoutUser() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

// Obter usuário atual
function getCurrentUser() {
  return auth.currentUser;
}

// Listener de mudança de autenticação
function onAuthChange(callback) {
  return auth.onAuthStateChanged(callback);
}

// ====================
// FUNÇÕES DE PERFIL
// ====================

// Obter perfil do usuário
async function getUserProfile(uid) {
  try {
    const doc = await usersCollection.doc(uid).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

// Atualizar perfil do usuário
async function updateUserProfile(uid, data) {
  try {
    await usersCollection.doc(uid).update({
      ...data,
      updatedAt: Date.now()
    });
    
    if (data.name && auth.currentUser) {
      await auth.currentUser.updateProfile({
        displayName: data.name
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}

// ====================
// FUNÇÕES DE TIPOS DE MASSAGEM
// ====================

async function saveType(typeData) {
  try {
    if (typeData.id) {
      await typesCollection.doc(typeData.id).set(typeData);
    } else {
      const newId = uid();
      typeData.id = newId;
      await typesCollection.doc(newId).set(typeData);
    }
    return typeData;
  } catch (error) {
    console.error('Erro ao salvar tipo:', error);
    throw error;
  }
}

async function getAllTypes() {
  try {
    const snapshot = await typesCollection.orderBy('name').get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Erro ao buscar tipos:', error);
    return [];
  }
}

async function deleteType(typeId) {
  try {
    await typesCollection.doc(typeId).delete();
  } catch (error) {
    console.error('Erro ao excluir tipo:', error);
    throw error;
  }
}

function onTypesChange(callback) {
  return typesCollection.onSnapshot(snapshot => {
    const types = snapshot.docs.map(doc => doc.data());
    callback(types);
  }, error => {
    console.error('Erro no listener de tipos:', error);
  });
}

// ====================
// FUNÇÕES DE AGENDAMENTOS
// ====================

async function saveAppointment(appointmentData) {
  try {
    if (appointmentData.id) {
      await appointmentsCollection.doc(appointmentData.id).set(appointmentData);
    } else {
      const newId = uid();
      appointmentData.id = newId;
      await appointmentsCollection.doc(newId).set(appointmentData);
    }
    return appointmentData;
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    throw error;
  }
}

async function getAllAppointments() {
  try {
    const snapshot = await appointmentsCollection.orderBy('start').get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return [];
  }
}

async function getUserAppointments(userId) {
  try {
    const snapshot = await appointmentsCollection
      .where('userId', '==', userId)
      .orderBy('start')
      .get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Erro ao buscar agendamentos do usuário:', error);
    return [];
  }
}

async function checkConflict(startTs, endTs, excludeId = null) {
  try {
    const snapshot = await appointmentsCollection
      .where('start', '<', endTs)
      .where('end', '>', startTs)
      .get();
    
    const conflicts = snapshot.docs
      .map(doc => doc.data())
      .filter(a => a.id !== excludeId);
    
    return conflicts.length > 0 ? conflicts[0] : null;
  } catch (error) {
    console.error('Erro ao verificar conflito:', error);
    return null;
  }
}

async function deleteAppointment(appointmentId) {
  try {
    await appointmentsCollection.doc(appointmentId).delete();
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    throw error;
  }
}

function onUserAppointmentsChange(userId, callback) {
  return appointmentsCollection
    .where('userId', '==', userId)
    .onSnapshot(snapshot => {
      const appointments = snapshot.docs.map(doc => doc.data());
      callback(appointments);
    }, error => {
      console.error('Erro no listener de agendamentos:', error);
    });
}

function onAppointmentsChange(callback) {
  return appointmentsCollection.onSnapshot(snapshot => {
    const appointments = snapshot.docs.map(doc => doc.data());
    callback(appointments);
  }, error => {
    console.error('Erro no listener de agendamentos:', error);
  });
}

// ====================
// FUNÇÕES DE DISPONIBILIDADE DE HORÁRIOS
// ====================

async function saveDayAvailability(dateStr, hoursAvailability) {
  try {
    const docId = dateStr;
    await availabilityCollection.doc(docId).set({
      date: dateStr,
      hours: hoursAvailability,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Erro ao salvar disponibilidade:', error);
    throw error;
  }
}

async function getDayAvailability(dateStr) {
  try {
    const doc = await availabilityCollection.doc(dateStr).get();
    if (doc.exists) {
      return doc.data().hours;
    }
    const defaultHours = {};
    for (let h = 8; h <= 22; h++) {
      defaultHours[h] = true;
    }
    return defaultHours;
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    const defaultHours = {};
    for (let h = 8; h <= 22; h++) {
      defaultHours[h] = true;
    }
    return defaultHours;
  }
}

function onAvailabilityChange(dateStr, callback) {
  return availabilityCollection.doc(dateStr).onSnapshot(snapshot => {
    if (snapshot.exists) {
      callback(snapshot.data().hours);
    } else {
      const defaultHours = {};
      for (let h = 8; h <= 22; h++) {
        defaultHours[h] = true;
      }
      callback(defaultHours);
    }
  }, error => {
    console.error('Erro no listener de disponibilidade:', error);
  });
}

// ====================
// FUNÇÕES UTILITÁRIAS
// ====================

function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now();
}

function formatMoney(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function toLocalDatetimeInput(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateStr(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function maskPhone(value) {
  value = value.replace(/\D/g, '');
  if (value.length <= 10) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else {
    value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  }
  return value;
}

function unmaskPhone(value) {
  return value.replace(/\D/g, '');
}

// ====================
// REGRAS DE SEGURANÇA DO FIRESTORE
// ====================
/*
Cole estas regras no Firebase Console -> Firestore Database -> Rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tipos de massagem - leitura pública, escrita apenas autenticados
    match /massage_types/{typeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Agendamentos
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Disponibilidade - leitura pública, escrita autenticados
    match /availability/{dateId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Perfis de usuários
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/