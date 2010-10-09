--
-- Table structure for tables `notifications`
--

CREATE TABLE `access` (
  `ac_user` varchar(255) CHARACTER SET utf8 NOT NULL DEFAULT "*",
  `ac_type` varchar(255) CHARACTER SET utf8 NOT NULL,
  `ac_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `ac_user_index` (`ac_user`),
  KEY `ac_type_index` (`ac_type`),
  KEY `ac_timestamp_index` (`ac_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
