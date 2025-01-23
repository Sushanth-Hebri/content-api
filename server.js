require('dotenv').config(); // Load environment variables

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
  res.send('Server is up and running!');
});


// Endpoint to fetch content from Firebase
// Endpoint to fetch all content from Firebase
app.get('/api/content', async (req, res) => {
  try {
    // Fetch all documents in the 'dailyContent' collection
    const snapshot = await db.collection('dailyContent').get();

    // Check if there are any documents
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No content found' });
    }

    // Map through the documents and dynamically get their data
    const contentArray = snapshot.docs.map(doc => {
      const docData = doc.data();
      const dynamicContent = {};

      // Loop through each key in the document's data
      for (const key in docData) {
        if (docData.hasOwnProperty(key)) {
          dynamicContent[key] = docData[key];
        }
      }

      return {
        id: doc.id, // Include the document ID
        content: dynamicContent, // Add dynamic content as a nested object
      };
    });

    // If no valid content found, filter out empty or null values
    const validContent = contentArray.filter(item => Object.values(item.content).some(value => value && value !== 'null'));

    // If no valid content is found, return an error
    if (validContent.length === 0) {
      return res.status(404).json({ error: 'No valid content found' });
    }

    // Return the valid content
    res.json({ content: validContent });
    
  } catch (error) {
    console.error('Error fetching content from Firebase:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
