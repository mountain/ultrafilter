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
-- Table structure for table `catgraph`
--

DROP TABLE IF EXISTS `catgraph`;

SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `catgraph` (
  `cat_from` int(11) DEFAULT NULL,
  `page_from` int(8) DEFAULT NULL,
  `cat_to` int(11) DEFAULT NULL,
  `page_to` int(8) DEFAULT NULL,
  KEY `page_from_index` (`page_from`),
  KEY `page_to_index` (`page_to`),
  KEY `cat_from_index` (`cat_from`),
  KEY `cat_to_index` (`cat_to`)
) ENGINE=InnoDB AUTO_INCREMENT=1369527 DEFAULT CHARSET=binary;
SET character_set_client = @saved_cs_client;

--
-- Fill data into catgraph
--

insert into catgraph(page_from, page_to) select cl.cl_from, p.page_id from categorylinks as cl, page as p where cl.cl_to = p.page_title and p.page_namespace=14;

update catgraph set cat_from = (select c.cat_id from category as c, page as p where c.cat_title = p.page_title and p.page_namespace=14 and p.page_id=page_from);

update catgraph set cat_to = (select c.cat_id from category as c, page as p where c.cat_title = p.page_title and p.page_namespace=14 and p.page_id=page_to);
