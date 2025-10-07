const chalk = require('chalk').default; // ADD .default

module.exports = {
    info: msg => console.log(chalk.blue(msg.toString())),
    error: msg => console.error(chalk.red(msg.toString())),
};
