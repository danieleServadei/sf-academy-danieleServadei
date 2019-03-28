module.exports = {
  setup: {
    users: "CREATE TABLE IF NOT EXISTS shop( id int(11) NOT NULL AUTO_INCREMENT, userId int(11) DEFAULT NULL, username varchar(255) DEFAULT NULL, price float DEFAULT NULL, tokens float DEFAULT NULL, date varchar(45) DEFAULT NULL, status varchar(45) DEFAULT 'available', buyerId int(11) DEFAULT NULL, PRIMARY KEY (id), UNIQUE KEY id_UNIQUE (id)) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;",
    shop: "CREATE TABLE IF NOT EXISTS users( id int(11) NOT NULL AUTO_INCREMENT, username varchar(255) DEFAULT NULL, email varchar(255) DEFAULT NULL, password varchar(255) DEFAULT NULL, wallet varchar(255) DEFAULT NULL, register_date varchar(255) DEFAULT NULL, eth_balance float DEFAULT '0', PRIMARY KEY (id), UNIQUE KEY wallet_UNIQUE (wallet)) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;"
  }
};