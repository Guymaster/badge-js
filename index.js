export function hello(name) {
    return `Hello, ${name}!`;
  }

  
  // CommonJS
module.exports = { hello };

// ES Modules
export { hello };
