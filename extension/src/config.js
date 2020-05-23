const config = {
  apiUrl:
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3030'
      : 'http://localhost:3030'
};

export default config;
