module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      psid: DataTypes.STRING,
      status: DataTypes.STRING,
      firstName: DataTypes.STRING,
    },
    {},
  );
  User.associate = function (models) {
    // associations can be defined here
  };
  return User;
};
