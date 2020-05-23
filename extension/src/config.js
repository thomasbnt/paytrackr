const config = {
  apiUrl:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3030'
      : 'https://paytrackr-api.now.sh'
};

export default config;
