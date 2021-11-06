const MarketplaceMigration = artifacts.require("CourseMarketplace"); //name of file

module.exports = function (deployer) {
  deployer.deploy(MarketplaceMigration); //name of object
};
