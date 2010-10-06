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
