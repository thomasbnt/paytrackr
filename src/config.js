const config = {
  apiUrl:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3030'
      : 'https://paytrackr-api.now.sh',
  decimalPlaces: 9,
  myPointer: '$coil.xrptipbot.com/701298d5-481d-40ff-9945-336671ab2c42'
};

export default config;
