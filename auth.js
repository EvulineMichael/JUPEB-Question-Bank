// Check auth state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const email = user.email;
    
    const docRef = db.collection("authorized_users").doc(email);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const userData = doc.data();
      
      // Check expiry
      if (userData.expiry_date) {
        const expiryDate = new Date(userData.expiry_date);
        const today = new Date();
        if (today > expiryDate) {
          document.getElementById('auth-status').innerHTML = 
            `<div style="background:#fff3cd;color:#856404;padding:12px;border-radius:8px;margin-bottom:16px;">
              <p>⏰ <strong>Access expired</strong></p>
              <p>Your access expired on ${userData.expiry_date}. Please renew.</p>
            </div>`;
          auth.signOut();
          return;
        }
      }
      
      // Access granted
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-content').style.display = 'block';
      window.authorizedSubjects = ['chemistry', 'physics', 'maths', 'biology'];
      
      if (typeof initJUPEBApp === 'function') {
        initJUPEBApp();
      }
    } else {
      document.getElementById('auth-status').innerHTML = 
        `<div style="background:#fff3cd;color:#856404;padding:12px;border-radius:8px;margin-bottom:16px;">
          <p>❌ <strong>${email}</strong> is not authorized yet.</p>
          <p>Follow payment instructions below to gain access.</p>
        </div>`;
      auth.signOut();
    }
  } else {
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('app-content').style.display = 'none';
  }
});


// Google Sign In
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => {
    alert('Login failed: ' + error.message);
  });
}

// Sign Out
function signOutUser() {
  auth.signOut();
}