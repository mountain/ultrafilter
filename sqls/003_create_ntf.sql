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
-- Table structure for tables `notifications`
--

CREATE TABLE `notifications` (
  `ntf_user` varchar(255) CHARACTER SET utf8 NOT NULL,
  `ntf_rc_id` int(11) NOT NULL,
  `ntf_talk_title` varchar(255) CHARACTER SET utf8 NOT NULL,
  KEY `ntf_user_index` (`ntf_user`),
  KEY `ntf_rc_id_index` (`ntf_rc_id`),
  KEY `ntf_talk_title_index` (`ntf_talk_title`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
