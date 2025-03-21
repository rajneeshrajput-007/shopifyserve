// const express = require('express');
// const axios = require('axios');
// const bodyParser = require('body-parser');

// const app = express();
// app.use(bodyParser.json());

// // Endpoint to handle carrier service requests from Shopify
// app.post('/carrier_service', async (req, res) => {
//   // Log that a request has been received
//   console.log('Received /carrier_service request:', JSON.stringify(req.body, null, 2));

//   const { rate } = req.body;
//   const destination = rate.destination;
//   const items = rate.items;

//   // Log extracted destination and items
//   console.log('Destination:', destination);
//   console.log('Items:', items);

//   try {
//     // Prepare the payload for the shipping API
//     const shippingPayload = {
//       height: 50,
//       length: 200,
//       width: 15,
//       dimensionUnit: "CM",
//       weight: 5,
//       WeightUnit: "KG",
//       quantity: 2,
//       shipTo: "US",
//       shipToCity: "New York",
//       shipToPostal: "10001",
//       productTotal: 100
//     };

//     // Log the payload being sent to the shipping API
//     console.log('Sending request to Shipping API:', JSON.stringify(shippingPayload, null, 2));

//     // Call your custom shipping API
//     const shippingResponse = await axios.post('https://my-apirn.onrender.com/calculate-shipping', shippingPayload);

//     // Log the response received from the shipping API
//     console.log('Received response from Shipping API:', JSON.stringify(shippingResponse.data, null, 2));

//     // Check if the API call was successful
//     if (shippingResponse.data.status !== 1) {
//       console.error('Shipping API returned an unsuccessful status:', shippingResponse.data.message);
//       throw new Error(shippingResponse.data.message || 'Failed to calculate shipping rates');
//     }

//     const shippingServices = shippingResponse.data.data.shippingServices;

//     // Log the extracted shipping services
//     console.log('Shipping Services:', JSON.stringify(shippingServices, null, 2));

//     // Transform the shippingServices object into an array
//     const shippingRates = Object.keys(shippingServices).map(code => {
//       const service = shippingServices[code];
//       return {
//         service_name: service.serviceLabel,
//         service_code: code,
//         total_price: (parseFloat(service.charge) * 100).toString(), // Convert to cents and string
//         currency: 'USD' // Ensure this matches your store's currency
//       };
//     });

//     // Log the formatted shipping rates to be sent to Shopify
//     console.log('Formatted Shipping Rates:', JSON.stringify(shippingRates, null, 2));

//     // Send the shipping rates back to Shopify
//     res.json({ rates: shippingRates });

//     // Log that the response has been sent
//     console.log('Shipping rates successfully sent to Shopify.');
//   } catch (error) {
//     // Log detailed error information
//     console.error('Error fetching shipping rates:', error.message || error);

//     // Send error response to Shopify
//     res.status(500).json({ error: 'Failed to calculate shipping rates' });
//   }
// });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Endpoint to handle carrier service requests from Shopify
app.post("/carrier_service", async (req, res) => {
  // Log that a request has been received
  // console.log(
  //   "Received /carrier_service request:",
  //   JSON.stringify(req.body, null, 2)
  // );

  const { rate } = req.body;
  const destination = rate.destination;
  const items = rate.items;

  // Log extracted destination and items
  // console.log("Destination:", destination);
  // console.log("Items:", items);

  // Initialize variables to store dimensions and weight
  let totalWeight = 0;
  let totalHeight = 0;
  let totalLength = 0;
  let totalWidth = 0;

  // Calculate total quantity
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  // Loop through each item to accumulate dimensions and weight
  for (const item of items) {
    // Get the built-in weight from the Shopify item object
    const weight = item.weight || 2; // Default to 0 if not found
    const height = item?.metafields?.height || 3; // Default to 0 if not found
    const length = item?.metafields?.length || 5; // Default to 0 if not found
    const width = item?.metafields?.width || 5; // Default to 0 if not found
    // console.log('weighttt:', weight);
    // console.log('heighttt:', height);
    // console.log('lengthtt:', length);
    // console.log('widthtt:', width);
    // console.log('quantitytt:', item.quantity);

    totalWeight += weight * item.quantity; // Accumulate total weight
    totalHeight = Math.max(totalHeight, height); // Get maximum height
    totalLength = Math.max(totalLength, length); // Get maximum length
    totalWidth = Math.max(totalWidth, width); // Get maximum width
  }

  try {
    // Prepare the payload for the shipping API
    const shippingPayload = {
      height: [totalHeight], // Convert to array
      length: [totalLength], // Convert to array
      width: [totalWidth], // Convert to array
      dimensionUnit: "CM",
      weight: [totalWeight], // Convert to array
      WeightUnit: "KG",
      quantity: totalQuantity,
      shipTo: destination.country,
      shipToCity: destination.city,
      shipToPostal: destination.postal_code,
      productTotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    };

    // Log the payload being sent to the shipping API
    console.log(
      "Sending request to Shipping API:",
      JSON.stringify(shippingPayload)
    );

    // Call your custom shipping API
    const shippingResponse = await axios.post(
      "https://www.shipbymail.com/admin/api/shipment/shipping_charge",
      shippingPayload
    );

    // Log the response received from the shipping API
    // console.log('Received response from Shipping API:', JSON.stringify(shippingResponse.data, null, 2));

    // Check if the API call was successful
    if (shippingResponse.data.status !== 1) {
      console.error(
        "Shipping API returned an unsuccessful status:",
        shippingResponse.data.message
      );
      throw new Error(
        shippingResponse.data.message || "Failed to calculate shipping rates"
      );
    }

    const shippingServices = shippingResponse.data.data.shippingServices;

    // Log the extracted shipping services
    // console.log(
    //   "Shipping Services:",
    //   JSON.stringify(shippingServices, null, 2)
    // );

    // Transform the shippingServices object into an array
    const shippingRates = Object.keys(shippingServices).map((code) => {
      const service = shippingServices[code];
      return {
        service_name: service.serviceLabel,
        service_code: code,
        total_price: (parseFloat(service.charge) * 100).toString(), // Convert to cents and string
        currency: "USD", // Ensure this matches your store's currency
      };
    });

    // Log the formatted shipping rates to be sent to Shopify
    // console.log(
    //   "Formatted Shipping Rates:",
    //   JSON.stringify(shippingRates, null, 2)
    // );

    // Send the shipping rates back to Shopify
    res.json({ rates: shippingRates });

    // Log that the response has been sent
    console.log("Shipping rates successfully sent to Shopify.");
  } catch (error) {
    if (error.response) {
      // The request was made, and the server responded with a status code outside the 2xx range
      console.error("Error fetching shipping rates:", error.response.data);
    } else if (error.request) {
      // The request was made, but no response was received
      console.error("No response received from Shipping API:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up the request:", error.message);
    }

    // Send error response to Shopify
    res.status(500).json({ error: "Failed to calculate shipping rates" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
