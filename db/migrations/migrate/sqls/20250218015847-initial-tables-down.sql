-- Drop the `data_tickets` table first because it has foreign key references
DROP TABLE IF EXISTS `data_tickets`;

-- Drop the `data_passengers` table
DROP TABLE IF EXISTS `data_passengers`;

-- Then drop the `core_train` table because `data_tickets` references it
DROP TABLE IF EXISTS `core_train`;

-- Drop `core_tickets` table
DROP TABLE IF EXISTS `core_tickets`;

-- Drop `core_seat_assignments` table
DROP TABLE IF EXISTS `core_seat_assignments`;

-- Drop `core_berths` table
DROP TABLE IF EXISTS `core_berths`;


-- Drop `core_ticket_status` table
DROP TABLE IF EXISTS `core_ticket_status`;


