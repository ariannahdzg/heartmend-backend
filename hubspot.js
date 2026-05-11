const axios = require('axios');

async function createContact({ email, firstname, lastname }) {
  try {
    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        properties: { email, firstname, lastname }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('Contacto ya existe:', email);
    } else {
      console.error('Error HubSpot:', error.response?.data);
    }
  }
}

module.exports = { createContact };