--
-- Prepare Enviroments
--

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for rc tables
--

CREATE TABLE `recentchanges` (
  `rc_id` int(11) NOT NULL,
  `rc_ns` int(11) NOT NULL,
  `rc_page_id` int(8) NOT NULL,
  `rc_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `rc_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rc_handled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`rc_id`),
  KEY `rc_page_id_index` (`rc_page_id`),
  KEY `rc_title_index` (`rc_title`),
  KEY `rc_timestamp_index` (`rc_timestamp`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE `filteredchanges` (
  `fc_id` int(11) NOT NULL AUTO_INCREMENT,
  `fc_cat_id` int(11) NOT NULL,
  `fc_rc_id` int(11) NOT NULL,
  PRIMARY KEY (`fc_id`),
  KEY `fc_cat_id_index` (`fc_cat_id`),
  KEY `fc_rc_id_index` (`fc_rc_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

