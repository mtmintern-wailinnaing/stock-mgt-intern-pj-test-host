CREATE DATABASE stock_mgt;
USE stock_mgt;
 
CREATE TABLE IF NOT EXISTS users (
   id BIGINT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL,
   password VARCHAR(255) NOT NULL,
   status BOOLEAN DEFAULT TRUE,
   last_login TIMESTAMP NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
   is_deleted BIGINT DEFAULT 0,
   UNIQUE KEY email_is_deleted_unique (email, is_deleted));
 
 
CREATE TABLE IF NOT EXISTS category (    
    id BIGINT AUTO_INCREMENT PRIMARY KEY,  
    name VARCHAR(255) NOT NULL,    
    minimum_threshold INT DEFAULT 0,    
    remark TEXT DEFAULT NULL,    
    parent_id BIGINT NULL,          
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,    
    deleted_at TIMESTAMP NULL,    
    FOREIGN KEY (parent_id) REFERENCES category(id) ON DELETE SET NULL
);
 
CREATE UNIQUE INDEX unique_active_category_name
ON category (name, (CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END));
 
 
CREATE TABLE IF NOT EXISTS month (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    month TINYINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year SMALLINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_month_year UNIQUE (month, year)
);
 
CREATE TABLE IF NOT EXISTS monthly_stock_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    month_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    opening_qty INT DEFAULT 0,
    closing_qty INT DEFAULT 0,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (month_id) REFERENCES month(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
);
 
-- Smart Index for monthly_stock_data
CREATE UNIQUE INDEX unique_active_monthly_category
ON monthly_stock_data (month_id, category_id, (CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END));
 
 
-- 2. Modified Table: Removed inner UNIQUE constraint
CREATE TABLE IF NOT EXISTS weekly_stock_check (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    month_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    used_qty_1st_week INT DEFAULT 0,
    used_qty_2nd_week INT DEFAULT 0,
    used_qty_3rd_week INT DEFAULT 0,
    used_qty_4th_week INT DEFAULT 0,
    used_qty_5th_week INT DEFAULT 0,
    checked_week_1 BOOLEAN DEFAULT FALSE,
    checked_week_2 BOOLEAN DEFAULT FALSE,
    checked_week_3 BOOLEAN DEFAULT FALSE,
    checked_week_4 BOOLEAN DEFAULT FALSE,
    checked_week_5 BOOLEAN DEFAULT FALSE,
    created_by BIGINT DEFAULT NULL,
    updated_by BIGINT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (month_id) REFERENCES month(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
);
 
CREATE UNIQUE INDEX unique_active_weekly_category
ON weekly_stock_check (month_id, category_id, (CASE WHEN deleted_at IS NULL THEN 1 ELSE NULL END));
CREATE TABLE IF NOT EXISTS purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    monthly_stock_id BIGINT NULL,
    category_id BIGINT NOT NULL,
    purchase_date DATE NOT NULL,
    quantity INT NOT NULL,
    purchase_price DECIMAL(10,2) DEFAULT 0.00,
    discount_price DECIMAL(10,2) DEFAULT 0.00,
    quantity_per_unit INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (monthly_stock_id) REFERENCES monthly_stock_data(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
);