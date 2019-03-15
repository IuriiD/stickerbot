module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('Users', 'firstName', Sequelize.STRING),
  down: (queryInterface, Sequelize) => queryInterface.removeColumn('Users', 'firstName', Sequelize.STRING),
};
