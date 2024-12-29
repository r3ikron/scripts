
class ValidatorException extends Error {

  constructor() {
    super("");
    this.name = 'ValidatorError';
    this.messages = new Object();
    this.count = 0;
  }

  addMessage(name, message) {
    if (typeof this.messages[name] == "undefined") {
      this.messages[name] = new Array();
    }
    this.messages[name].push(message);
    this.count++;
  }

  hasErrors() {
    return (this.count > 0);
  }

  getAllMessages() {
    let messages = "";
    Object.entries(this.messages).forEach(([key, value]) => {
      Object.values(value).forEach((value) => {
        messages += value + "\n";
      });
    });
    return messages.trim();
  }
}

module.exports = { ValidatorException };
