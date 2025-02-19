DROP TABLE IF EXISTS `core_ticket_status`;
CREATE TABLE `core_ticket_status` (
    `id` int NOT NULL AUTO_INCREMENT,
    `code` varchar(255) NOT NULL,
    `label` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `core_ticket_status` (`id`, `code`, `label`) VALUES 
(1, 'CONFIRMED', 'confirmed'),
(2, 'WAITING_LIST', 'waiting_list'),
(3, 'CANCELLED', 'cancelled'),
(4, 'RAC_CONFIRMED', 'rac_confirmed');


DROP TABLE IF EXISTS `core_berths`;
CREATE TABLE `core_berths` (
    `id` int NOT NULL AUTO_INCREMENT,
    `code` varchar(255) NOT NULL,
    `label` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `core_berths` (`id`, `code`, `label`) VALUES 
(1, 'LOWER', 'lower'),
(2, 'MIDDLE', 'middle'),
(3, 'UPPER', 'upper'),
(4, 'SIDE_LOWER', 'side_lower'),
(5, 'SIDE_UPPER', 'side_upper');

DROP TABLE IF EXISTS `core_seat_assignments`;
CREATE TABLE `core_seat_assignments` (
    `seat_number` int NOT NULL,
    `berth_type_id` int NOT NULL,
    PRIMARY KEY (`seat_number`),
    FOREIGN KEY (`berth_type_id`) REFERENCES `core_berths` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `core_seat_assignments` (`seat_number`, `berth_type_id`)
VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 1),
(5, 2),
(6, 3),
(7, 4),
(8, 5),

(9, 1),
(10, 2),
(11, 3),
(12, 1),
(13, 2),
(14, 3),
(15, 4),
(16, 5),

(17, 1),
(18, 2),
(19, 3),
(20, 1),
(21, 2),
(22, 3),
(23, 4),
(24, 5),

(25, 1),
(26, 2),
(27, 3),
(28, 1),
(29, 2),
(30, 3),
(31, 4),
(32, 5),

(33, 1),
(34, 2),
(35, 3),
(36, 1),
(37, 2),
(38, 3),
(39, 4),
(40, 5),

(41, 1),
(42, 2),
(43, 3),
(44, 1),
(45, 2),
(46, 3),
(47, 4),
(48, 5),

(49, 1),
(50, 2),
(51, 3),
(52, 1),
(53, 2),
(54, 3),
(55, 4),
(56, 5),

(57, 1),
(58, 2),
(59, 3),
(60, 1),
(61, 2),
(62, 3),
(63, 4),
(64, 5),

(65, 1),
(66, 2),
(67, 3),
(68, 1),
(69, 2),
(70, 3),
(71, 4),
(72, 5);

DROP TABLE IF EXISTS `core_tickets`;
CREATE TABLE `core_tickets` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `berth_code` varchar(255) NOT NULL,
    `value` int NOT NULL,
    PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `core_tickets` (`id`, `name`, `berth_code`, `value`)
VALUES 
(1, 'confirmed_ticket', 'LOWER', 18),
(2, 'confirmed_ticket', 'MIDDLE', 18),
(3, 'confirmed_ticket', 'UPPER', 18),
(4, 'confirmed_ticket', 'SIDE_UPPER', 9),
(5, 'rac_ticket', 'SIDE_LOWER', 9),
(6, 'waiting_list_ticket', 'WAITING_LIST', 10);


DROP TABLE IF EXISTS `core_train`;
CREATE TABLE `core_train` (
    `id` int NOT NULL AUTO_INCREMENT,
    `train_number` varchar(255) NOT NULL,
    `train_name` varchar(255) NOT NULL,
    `train_type` varchar(255) NOT NULL,
    `train_start` varchar(255) NOT NULL,
    `train_end` varchar(255) NOT NULL,
    `train_start_time` varchar(255) NOT NULL,
    `train_end_time` varchar(255) NOT NULL,
    `train_duration` varchar(255) NOT NULL,
    `train_distance` varchar(255) NOT NULL,
    `train_fare` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `core_train` (`id`, `train_number`, `train_name`, `train_type`, `train_start`, `train_end`, `train_start_time`, `train_end_time`, `train_duration`, `train_distance`, `train_fare`) VALUES 
(1, '12345', 'Shatabdi Express', 'Express', 'Delhi', 'Mumbai', '10:00', '20:00', '10 hours', '1000 km', '1000 INR'),
(2, '54321', 'Rajdhani Express', 'Express', 'Mumbai', 'Delhi', '10:00', '20:00', '10 hours', '1000 km', '1000 INR'),
(3, '67890', 'Duronto Express', 'Express', 'Delhi', 'Kolkata', '10:00', '20:00', '10 hours', '1000 km', '1000 INR');



DROP TABLE IF EXISTS `data_passengers`;
CREATE TABLE `data_passengers` (
    `id` char(36) NOT NULL,
    `first_name` varchar(255) NOT NULL,
    `last_name` varchar(255) NOT NULL,
    `email` varchar(255) NOT NULL,
    `age` int NOT NULL,
    `gender` varchar(255) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `data_tickets`;
CREATE TABLE `data_tickets` (
    `id` char(36) NOT NULL,
    `seat_number` varchar(255),
    `passenger_id` char(36) NOT NULL,
    `status_id` int NOT NULL,
    `berth_id` int DEFAULT NULL,
    `train_id` int NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`passenger_id`) REFERENCES `data_passengers` (`id`),
    FOREIGN KEY (`status_id`) REFERENCES `core_ticket_status` (`id`),
    FOREIGN KEY (`berth_id`) REFERENCES `core_berths` (`id`),
    FOREIGN KEY (`train_id`) REFERENCES `core_train` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

