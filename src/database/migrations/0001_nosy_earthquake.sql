CREATE TABLE new_response (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    modelId TEXT NOT NULL,
    error TEXT,
    createdAt TEXT DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (projectId) REFERENCES project(id) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO new_response SELECT * FROM response;
--> statement-breakpoint
DROP TABLE response;
--> statement-breakpoint
ALTER TABLE new_response RENAME TO response;
--> statement-breakpoint
CREATE TABLE new_responseMessage (
    id TEXT PRIMARY KEY,
    "index" INTEGER NOT NULL,
    responseId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (responseId) REFERENCES response(id) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO new_responseMessage SELECT * FROM responseMessage;
--> statement-breakpoint
DROP TABLE responseMessage;
--> statement-breakpoint
ALTER TABLE new_responseMessage RENAME TO responseMessage;
--> statement-breakpoint
CREATE TABLE new_model (
    id TEXT PRIMARY KEY,
    serviceId TEXT NOT NULL,
    name TEXT NOT NULL,
    visible INTEGER NOT NULL,
    createdAt TEXT DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (serviceId) REFERENCES service(id) ON DELETE CASCADE,
    UNIQUE (serviceId, name)
);
--> statement-breakpoint
INSERT INTO new_model SELECT * FROM model;
--> statement-breakpoint
DROP TABLE model;
--> statement-breakpoint
ALTER TABLE new_model RENAME TO model;
--> statement-breakpoint
CREATE INDEX projectId_idx ON response(projectId);
--> statement-breakpoint
CREATE INDEX responseId_idx ON responseMessage(responseId);
--> statement-breakpoint
CREATE INDEX serviceId_idx ON model(serviceId);
--> statement-breakpoint
CREATE UNIQUE INDEX `serviceName_unique` ON `model` (`serviceId`,`name`);
