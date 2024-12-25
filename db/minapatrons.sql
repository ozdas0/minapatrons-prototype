CREATE DATABASE contents_app;
USE contents_app;


CREATE TABLE contents (
    id CHAR(11) NOT NULL PRIMARY KEY,
    contentName text NOT NULL,
    contentData LONGBLOB,
    timestamp bigint(20) NOT NULL
);

CREATE TABLE identity_commitment {
    ic VARCHAR(256) NOT NULL PRIMARY KEY,
    content_id CHAR(11) NOT NULL,
    timestamp bigint(20) NOT NULL,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE
};

CREATE TABLE creators {
    id int(11)  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ic VARCHAR(256) NOT NULL,
    creator_name text NOT NULL,
};