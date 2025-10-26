# API Specification

This document contains the complete API specification for the Treasury Analytics Banking Platform.

## Database Models

```prisma
model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique
  name            String?
  password        String
  role            Role     @default(USER)
  isEmailVerified Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  Token           Token[]
  Client          Client[]
}

enum Role {
  USER
  ADMIN
}

model Token {
  id          Int       @id @default(autoincrement())
  token       String
  type        TokenType
  expires     DateTime
  blacklisted Boolean
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
  userId      Int
}

enum TokenType {
  ACCESS
  REFRESH
  RESET_PASSWORD
  VERIFY_EMAIL
}

model Client {
  id                     String           @id @default(uuid())
  name                   String
  businessType          String
  industry              String
  businessSegment       String
  riskProfile           String           @default("medium")
  relationshipManagerId  Int
  relationshipManager    User             @relation(fields: [relationshipManagerId], references: [id])
  contact                Json
  preferences           Json             @default("{}")
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt
  ClientAccount         ClientAccount[]
  Statement             Statement[]
  BankConnection        BankConnection[]
  ProcessingTask        ProcessingTask[]
  Recommendation        Recommendation[]
  Transaction           Transaction[]
}

model ClientAccount {
  id            String        @id @default(uuid())
  accountNumber String        @unique
  accountType   String
  bankName      String
  routingNumber String?
  isActive      Boolean       @default(true)
  openDate      DateTime
  balance       Float?
  currency      String        @default("USD")
  clientId      String
  client        Client        @relation(fields: [clientId], references: [id])
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  Statement     Statement[]
  Transaction   Transaction[]
  BankConnection BankConnection[]
}

model Statement {
  id          String        @id @default(uuid())
  fileName    String
  fileSize    Int
  fileType    String
  filePath    String?
  uploadDate  DateTime      @default(now())
  status      StatementStatus
  clientId    String
  client      Client        @relation(fields: [clientId], references: [id])
  accountId   String?
  account     ClientAccount? @relation(fields: [accountId], references: [id])
  period      Json?
  errorMessage String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  Transaction Transaction[]
  ProcessingTask ProcessingTask[]
}

enum StatementStatus {
  UPLOADED
  PROCESSING
  COMPLETED
  FAILED
  VALIDATED
}

model BankConnection {
  id             String   @id @default(uuid())
  clientId       String
  client         Client   @relation(fields: [clientId], references: [id])
  accountId      String
  account        ClientAccount @relation(fields: [accountId], references: [id])
  bankName       String
  connectionType ConnectionType
  lastSync       DateTime?
  status         ConnectionStatus @default(CONNECTED)
  credentials    Json?
  settings       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum ConnectionStatus {
  CONNECTED
  DISCONNECTED
  ERROR
  SYNCING
}

enum ConnectionType {
  API
  PLAID
  YODLEE
  MANUAL
}

model Transaction {
  id           String        @id @default(uuid())
  accountId    String
  account      ClientAccount @relation(fields: [accountId], references: [id])
  clientId     String
  client       Client        @relation(fields: [clientId], references: [id])
  statementId  String?
  statement    Statement?    @relation(fields: [statementId], references: [id])
  date         DateTime
  description  String
  amount       Float
  type         TransactionType
  category     String?
  counterparty String?
  balanceAfter Float?
  metadata     Json?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

enum TransactionType {
  DEBIT
  CREDIT
  ACH
  WIRE
  CHECK
  TRANSFER
  FEE
  INTEREST
  OTHER
}

model ProcessingTask {
  id                Int      @id @default(autoincrement())
  taskId           String   @unique @default(uuid())
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id])
  statementId      String?
  statement        Statement? @relation(fields: [statementId], references: [id])
  type             TaskType
  status           TaskStatus
  progress         Int      @default(0)
  startTime        DateTime @default(now())
  endTime          DateTime?
  estimatedDuration Int?
  currentStep      Json?
  steps            Json
  error            Json?
  results          Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

enum TaskType {
  STATEMENT_PARSE
  DATA_SYNC
  ANALYSIS
  RECOMMENDATION_GENERATION
}

enum TaskStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

model TreasuryProduct {
  id                  String           @id @default(uuid())
  name                String
  category            String
  description         String
  features            String[]
  eligibilityCriteria Json
  pricing             Json
  benefits            Json[]
  riskLevel           String
  liquidityFeatures   String[]
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  Recommendation      Recommendation[]
}

model Recommendation {
  id               String          @id @default(uuid())
  clientId         String
  client           Client          @relation(fields: [clientId], references: [id])
  productId        String
  product          TreasuryProduct @relation(fields: [productId], references: [id])
  priority         RecommendationPriority @default(MEDIUM)
  rationale        Json
  estimatedBenefit Json
  implementation   Json
  supportingData   Json[]
  confidence       Float
  status           RecommendationStatus @default(PENDING)
  reviewedBy       String?
  reviewedAt       DateTime?
  implementedAt    DateTime?
  notes            String?
  feedback         Json?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}

enum RecommendationPriority {
  HIGH
  MEDIUM
  LOW
}

enum RecommendationStatus {
  PENDING
  APPROVED
  REJECTED
  IMPLEMENTED
}
```

## Authentication APIs

EP: POST /auth/login
DESC: Authenticate user with email and password.
IN: body:{email:str!, password:str!}
OUT: 200:{user:obj{id:int, email:str, name:str, role:str}, tokens:obj{access:obj{token:str, expires:str}, refresh:obj{token:str, expires:str}}}
ERR: {"400":"Invalid credentials", "401":"Email not verified", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/login -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"password123"}'
EX_RES_200: {"user":{"id":1,"email":"user@example.com","name":"John Doe","role":"USER"},"tokens":{"access":{"token":"eyJ...","expires":"2024-01-15T11:00:00Z"},"refresh":{"token":"eyJ...","expires":"2024-02-15T10:00:00Z"}}}

---

EP: POST /auth/register
DESC: Register a new user account.
IN: body:{email:str!, password:str!, name:str}
OUT: 201:{user:obj{id:int, email:str, name:str, role:str}, tokens:obj{access:obj{token:str, expires:str}, refresh:obj{token:str, expires:str}}}
ERR: {"400":"Invalid input data", "409":"Email already exists", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/register -H "Content-Type: application/json" -d '{"email":"new@example.com","password":"password123","name":"Jane Doe"}'
EX_RES_201: {"user":{"id":2,"email":"new@example.com","name":"Jane Doe","role":"USER"},"tokens":{"access":{"token":"eyJ...","expires":"2024-01-15T11:00:00Z"},"refresh":{"token":"eyJ...","expires":"2024-02-15T10:00:00Z"}}}

---

EP: POST /auth/refresh
DESC: Refresh access token using refresh token.
IN: body:{refreshToken:str!}
OUT: 200:{tokens:obj{access:obj{token:str, expires:str}, refresh:obj{token:str, expires:str}}}
ERR: {"401":"Invalid refresh token", "403":"Token expired", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/refresh -H "Content-Type: application/json" -d '{"refreshToken":"eyJ..."}'
EX_RES_200: {"tokens":{"access":{"token":"eyJ...","expires":"2024-01-15T11:00:00Z"},"refresh":{"token":"eyJ...","expires":"2024-02-15T10:00:00Z"}}}

---

EP: POST /auth/logout
DESC: Logout user and blacklist refresh token.
IN: body:{refreshToken:str!}
OUT: 204:{}
ERR: {"400":"Missing refresh token", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/logout -H "Content-Type: application/json" -d '{"refreshToken":"eyJ..."}'
EX_RES_204: {}

## Client Management APIs

EP: GET /clients
DESC: Retrieve paginated list of clients.
IN: query:{page:int, limit:int}
OUT: 200:{clients:arr[obj{id:str, name:str, businessType:str, industry:str, businessSegment:str, riskProfile:str, relationshipManager:obj{id:str, name:str, email:str, department:str}, contact:obj, preferences:obj, createdAt:str, updatedAt:str}], total:int, pages:int}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET "/clients?page=1&limit=20" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"clients":[{"id":"client-123","name":"ABC Corp","businessType":"Corporation","industry":"Technology","businessSegment":"medium","riskProfile":"medium","relationshipManager":{"id":"rm-456","name":"John Smith","email":"john@bank.com","department":"Commercial Banking"},"contact":{},"preferences":{},"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:00:00Z"}],"total":1,"pages":1}

---

EP: GET /clients/{clientId}
DESC: Get specific client details by ID.
IN: params:{clientId:str!}
OUT: 200:{id:str, name:str, businessType:str, industry:str, businessSegment:str, riskProfile:str, relationshipManager:obj, accounts:arr[obj], contact:obj, preferences:obj, createdAt:str, updatedAt:str}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /clients/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"id":"client-123","name":"ABC Corp","businessType":"Corporation","industry":"Technology","businessSegment":"medium","riskProfile":"medium","relationshipManager":{"id":"rm-456","name":"John Smith","email":"john@bank.com","department":"Commercial Banking"},"accounts":[],"contact":{},"preferences":{},"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:00:00Z"}

---

EP: POST /clients
DESC: Create a new client.
IN: body:{name:str!, businessType:str!, industry:str!, relationshipManagerId:int!, businessSegment:str!, contact:obj!, preferences:obj}
OUT: 201:{id:str, name:str, businessType:str, industry:str, businessSegment:str, riskProfile:str, relationshipManager:obj, accounts:arr, contact:obj, preferences:obj, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input data", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /clients -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"name":"New Corp","businessType":"LLC","industry":"Finance","relationshipManagerId":456,"businessSegment":"small","contact":{"primaryContact":{"name":"Jane Doe","title":"CFO","email":"jane@newcorp.com","phone":"555-0123"}}}'
EX_RES_201: {"id":"client-789","name":"New Corp","businessType":"LLC","industry":"Finance","businessSegment":"small","riskProfile":"medium","relationshipManager":{"id":456,"name":"John Smith","email":"john@bank.com","department":"Commercial Banking"},"accounts":[],"contact":{"primaryContact":{"name":"Jane Doe","title":"CFO","email":"jane@newcorp.com","phone":"555-0123"}},"preferences":{},"createdAt":"2024-01-15T10:30:00Z","updatedAt":"2024-01-15T10:30:00Z"}

---

EP: PUT /clients/{clientId}
DESC: Update client information.
IN: params:{clientId:str!}, body:{name:str, businessType:str, industry:str, relationshipManagerId:int, businessSegment:str, contact:obj, preferences:obj}
OUT: 200:{id:str, name:str, businessType:str, industry:str, businessSegment:str, riskProfile:str, relationshipManager:obj, accounts:arr, contact:obj, preferences:obj, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input data", "401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X PUT /clients/client-123 -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"name":"ABC Corporation","industry":"Technology Services"}'
EX_RES_200: {"id":"client-123","name":"ABC Corporation","businessType":"Corporation","industry":"Technology Services","businessSegment":"medium","riskProfile":"medium","relationshipManager":{"id":"rm-456","name":"John Smith","email":"john@bank.com","department":"Commercial Banking"},"accounts":[],"contact":{},"preferences":{},"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:45:00Z"}

---

EP: DELETE /clients/{clientId}
DESC: Delete a client record.
IN: params:{clientId:str!}
OUT: 204:{}
ERR: {"401":"Unauthorized", "404":"Client not found", "409":"Client has active accounts", "500":"Internal server error"}
EX_REQ: curl -X DELETE /clients/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_204: {}

---

EP: GET /clients/search
DESC: Search clients by name, industry, or business type.
IN: query:{q:str!}
OUT: 200:arr[obj{id:str, name:str, businessType:str, industry:str, businessSegment:str, riskProfile:str, relationshipManager:obj, contact:obj, preferences:obj, createdAt:str, updatedAt:str}]
ERR: {"400":"Missing search query", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET "/clients/search?q=technology" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"client-123","name":"ABC Corp","businessType":"Corporation","industry":"Technology","businessSegment":"medium","riskProfile":"medium","relationshipManager":{"id":"rm-456","name":"John Smith","email":"john@bank.com","department":"Commercial Banking"},"contact":{},"preferences":{},"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:00:00Z"}]

---

EP: GET /relationship-managers/{rmId}/clients
DESC: Get all clients assigned to a relationship manager.
IN: params:{rmId:int!}
OUT: 200:arr[obj{id:str, name:str, businessType:str, industry:str, businessSegment:str, riskProfile:str, relationshipManager:obj, contact:obj, preferences:obj, createdAt:str, updatedAt:str}]
ERR: {"401":"Unauthorized", "404":"Relationship manager not found", "500":"Internal server error"}
EX_REQ: curl -X GET /relationship-managers/rm-456/clients -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"client-123","name":"ABC Corp","businessType":"Corporation","industry":"Technology","businessSegment":"medium","riskProfile":"medium","relationshipManager":{"id":"rm-456","name":"John Smith","email":"john@bank.com","department":"Commercial Banking"},"contact":{},"preferences":{},"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:00:00Z"}]

---

EP: PATCH /clients/{clientId}/preferences
DESC: Update client preferences.
IN: params:{clientId:str!}, body:{communicationChannel:str, reportFrequency:str, riskTolerance:str, liquidityPriority:str, yieldPriority:str}
OUT: 200:{}
ERR: {"400":"Invalid preferences data", "401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X PATCH /clients/client-123/preferences -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"reportFrequency":"weekly","riskTolerance":"aggressive"}'
EX_RES_200: {}

---

EP: GET /clients/{clientId}/accounts
DESC: Get all accounts for a specific client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{id:str, accountNumber:str, accountType:str, bankName:str, routingNumber:str, isActive:bool, openDate:str, balance:float, currency:str}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /clients/client-123/accounts -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"acc-456","accountNumber":"123456789","accountType":"Checking","bankName":"ABC Bank","routingNumber":"021000021","isActive":true,"openDate":"2023-01-15T00:00:00Z","balance":150000.00,"currency":"USD"}]

---

EP: POST /clients/{clientId}/accounts
DESC: Add a new account for a client.
IN: params:{clientId:str!}, body:{accountNumber:str!, accountType:str!, bankName:str!, routingNumber:str, openDate:str!, balance:float, currency:str}
OUT: 201:{id:str, accountNumber:str, accountType:str, bankName:str, routingNumber:str, isActive:bool, openDate:str, balance:float, currency:str}
ERR: {"400":"Invalid account data", "401":"Unauthorized", "404":"Client not found", "409":"Account number already exists", "500":"Internal server error"}
EX_REQ: curl -X POST /clients/client-123/accounts -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"accountNumber":"987654321","accountType":"Savings","bankName":"XYZ Bank","openDate":"2024-01-15T00:00:00Z","balance":50000.00,"currency":"USD"}'
EX_RES_201: {"id":"acc-789","accountNumber":"987654321","accountType":"Savings","bankName":"XYZ Bank","routingNumber":"","isActive":true,"openDate":"2024-01-15T00:00:00Z","balance":50000.00,"currency":"USD"}

---

EP: PATCH /clients/{clientId}/accounts/{accountId}
DESC: Update account information.
IN: params:{clientId:str!, accountId:str!}, body:{accountType:str, bankName:str, routingNumber:str, isActive:bool, balance:float, currency:str}
OUT: 200:{id:str, accountNumber:str, accountType:str, bankName:str, routingNumber:str, isActive:bool, openDate:str, balance:float, currency:str}
ERR: {"400":"Invalid account data", "401":"Unauthorized", "404":"Client or account not found", "500":"Internal server error"}
EX_REQ: curl -X PATCH /clients/client-123/accounts/acc-456 -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"balance":175000.00,"isActive":true}'
EX_RES_200: {"id":"acc-456","accountNumber":"123456789","accountType":"Checking","bankName":"ABC Bank","routingNumber":"021000021","isActive":true,"openDate":"2023-01-15T00:00:00Z","balance":175000.00,"currency":"USD"}

## Statement Management APIs

EP: POST /statements/upload
DESC: Upload bank statements for processing.
IN: body:{files:arr[file]!, clientId:str!, statementPeriod:obj{startDate:str!, endDate:str!}}
OUT: 201:arr[obj{id:str, fileName:str, fileSize:int, fileType:str, uploadDate:str, status:str, clientId:str, accountId:str}]
ERR: {"400":"Invalid file format or missing data", "401":"Unauthorized", "413":"File too large", "500":"Internal server error"}
EX_REQ: curl -X POST /statements/upload -H "Authorization: Bearer eyJ..." -F "files[0]=@statement.pdf" -F "clientId=client-123" -F 'statementPeriod={"startDate":"2024-01-01","endDate":"2024-01-31"}'
EX_RES_201: [{"id":"stmt-456","fileName":"statement.pdf","fileSize":524288,"fileType":"pdf","uploadDate":"2024-01-15T10:00:00Z","status":"uploaded","clientId":"client-123","accountId":"acc-456"}]

---

EP: GET /statements/{fileId}/validate
DESC: Validate uploaded statement file structure and content.
IN: params:{fileId:str!}
OUT: 200:{isValid:bool, errors:arr[str], warnings:arr[str], parsedTransactionCount:int, accountsFound:arr[str]}
ERR: {"401":"Unauthorized", "404":"Statement file not found", "500":"Internal server error"}
EX_REQ: curl -X GET /statements/stmt-456/validate -H "Authorization: Bearer eyJ..."
EX_RES_200: {"isValid":true,"errors":[],"warnings":["Some transaction dates may be inferred"],"parsedTransactionCount":247,"accountsFound":["123456789"]}

---

EP: GET /statements/{fileId}/status
DESC: Get current processing status of statement file.
IN: params:{fileId:str!}
OUT: 200:{status:str, progress:int}
ERR: {"401":"Unauthorized", "404":"Statement file not found", "500":"Internal server error"}
EX_REQ: curl -X GET /statements/stmt-456/status -H "Authorization: Bearer eyJ..."
EX_RES_200: {"status":"completed","progress":100}

---

EP: POST /statements/parse
DESC: Start parsing process for uploaded statements.
IN: body:{fileIds:arr[str]!}
OUT: 202:{taskId:str}
ERR: {"400":"Invalid file IDs", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /statements/parse -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"fileIds":["stmt-456","stmt-789"]}'
EX_RES_202: {"taskId":"task-123"}

---

EP: GET /clients/{clientId}/statements
DESC: Get all statements for a specific client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{id:str, fileName:str, fileSize:int, fileType:str, uploadDate:str, status:str, clientId:str, accountId:str}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /clients/client-123/statements -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"stmt-456","fileName":"statement.pdf","fileSize":524288,"fileType":"pdf","uploadDate":"2024-01-15T10:00:00Z","status":"completed","clientId":"client-123","accountId":"acc-456"}]

---

EP: POST /statements/connect
DESC: Connect to bank for automatic statement retrieval.
IN: body:{clientId:str!, bankName:str!, accountId:str!, connectionType:str!}
OUT: 201:{id:str, bankName:str, accountId:str, connectionType:str, lastSync:str, status:str}
ERR: {"400":"Invalid connection data", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /statements/connect -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"clientId":"client-123","bankName":"ABC Bank","accountId":"acc-456","connectionType":"api"}'
EX_RES_201: {"id":"conn-789","bankName":"ABC Bank","accountId":"acc-456","connectionType":"api","lastSync":"2024-01-15T10:00:00Z","status":"connected"}

---

EP: GET /clients/{clientId}/bank-connections
DESC: Get all bank connections for a client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{id:str, bankName:str, accountId:str, connectionType:str, lastSync:str, status:str}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /clients/client-123/bank-connections -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"conn-789","bankName":"ABC Bank","accountId":"acc-456","connectionType":"api","lastSync":"2024-01-15T10:00:00Z","status":"connected"}]

---

EP: POST /bank-connections/{connectionId}/sync
DESC: Trigger manual synchronization of bank connection.
IN: params:{connectionId:str!}
OUT: 202:{taskId:str}
ERR: {"401":"Unauthorized", "404":"Connection not found", "500":"Internal server error"}
EX_REQ: curl -X POST /bank-connections/conn-789/sync -H "Authorization: Bearer eyJ..."
EX_RES_202: {"taskId":"sync-task-456"}

---

EP: GET /clients/{clientId}/upload-progress
DESC: Get upload progress for client's files.
IN: params:{clientId:str!}
OUT: 200:arr[obj{fileId:str, fileName:str, progress:int, status:str, error:str}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /clients/client-123/upload-progress -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"fileId":"stmt-456","fileName":"statement.pdf","progress":100,"status":"completed","error":""}]

---

EP: DELETE /statements/{fileId}
DESC: Delete a statement file.
IN: params:{fileId:str!}
OUT: 204:{}
ERR: {"401":"Unauthorized", "404":"Statement file not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /statements/stmt-456 -H "Authorization: Bearer eyJ..."
EX_RES_204: {}

---

EP: GET /statements/{fileId}/download
DESC: Download a statement file.
IN: params:{fileId:str!}
OUT: 200:{blob}
ERR: {"401":"Unauthorized", "404":"Statement file not found", "500":"Internal server error"}
EX_REQ: curl -X GET /statements/stmt-456/download -H "Authorization: Bearer eyJ..."
EX_RES_200: {blob}

## Transaction APIs

EP: GET /transactions
DESC: Get transactions for a client and optionally filter by account.
IN: query:{clientId:str!, accountId:str}
OUT: 200:arr[obj{id:str, accountId:str, date:str, description:str, amount:float, type:str, category:str, counterparty:str, balanceAfter:float, createdAt:str, updatedAt:str}]
ERR: {"400":"Missing clientId", "401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/transactions?clientId=client-123&accountId=acc-456" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"txn-789","accountId":"acc-456","date":"2024-01-15T00:00:00Z","description":"ACH Transfer","amount":-2500.00,"type":"ach","category":"Transfer","counterparty":"XYZ Corp","balanceAfter":147500.00,"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:00:00Z"}]

## Processing APIs

EP: GET /processing/tasks/{taskId}
DESC: Get detailed information about a processing task.
IN: params:{taskId:str!}
OUT: 200:{id:str, clientId:str, type:str, status:str, progress:int, startTime:str, endTime:str, estimatedDuration:int, currentStep:obj, steps:arr[obj], error:obj, results:obj}
ERR: {"401":"Unauthorized", "404":"Task not found", "500":"Internal server error"}
EX_REQ: curl -X GET /processing/tasks/task-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"id":"task-123","clientId":"client-123","type":"statement_parse","status":"completed","progress":100,"startTime":"2024-01-15T10:00:00Z","endTime":"2024-01-15T10:05:00Z","estimatedDuration":300000,"currentStep":{"id":"step-5","name":"Analysis Generation","description":"Generating financial insights and analytics","status":"completed","progress":100},"steps":[],"error":null,"results":{"transactionCount":247,"accountsProcessed":["acc-456"],"dataQualityScore":95,"warnings":[],"processingTime":300000}}

---

EP: GET /processing/clients/{clientId}/tasks
DESC: Get all processing tasks for a client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{id:str, clientId:str, type:str, status:str, progress:int, startTime:str, endTime:str, estimatedDuration:int, currentStep:obj, steps:arr[obj], error:obj, results:obj}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /processing/clients/client-123/tasks -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"task-123","clientId":"client-123","type":"statement_parse","status":"completed","progress":100,"startTime":"2024-01-15T10:00:00Z","endTime":"2024-01-15T10:05:00Z","estimatedDuration":300000,"currentStep":{"id":"step-5","name":"Analysis Generation","description":"Generating financial insights and analytics","status":"completed","progress":100},"steps":[],"error":null,"results":{"transactionCount":247,"accountsProcessed":["acc-456"],"dataQualityScore":95,"warnings":[],"processingTime":300000}}]

---

EP: POST /processing/start
DESC: Start a new processing task.
IN: body:{clientId:str!, type:str!, options:obj}
OUT: 202:{taskId:str}
ERR: {"400":"Invalid processing parameters", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /processing/start -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"clientId":"client-123","type":"analysis","options":{"includeRecommendations":true}}'
EX_RES_202: {"taskId":"task-456"}

---

EP: POST /processing/tasks/{taskId}/cancel
DESC: Cancel a running processing task.
IN: params:{taskId:str!}
OUT: 200:{}
ERR: {"401":"Unauthorized", "404":"Task not found", "409":"Task cannot be cancelled", "500":"Internal server error"}
EX_REQ: curl -X POST /processing/tasks/task-123/cancel -H "Authorization: Bearer eyJ..."
EX_RES_200: {}

---

EP: POST /processing/tasks/{taskId}/retry
DESC: Retry a failed processing task.
IN: params:{taskId:str!}
OUT: 202:{taskId:str}
ERR: {"401":"Unauthorized", "404":"Task not found", "409":"Task cannot be retried", "500":"Internal server error"}
EX_REQ: curl -X POST /processing/tasks/task-123/retry -H "Authorization: Bearer eyJ..."
EX_RES_202: {"taskId":"task-789"}

---

EP: GET /processing/metrics
DESC: Get overall processing system metrics.
IN: {}
OUT: 200:{totalTasks:int, completedTasks:int, failedTasks:int, averageProcessingTime:int, currentLoad:float}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET /processing/metrics -H "Authorization: Bearer eyJ..."
EX_RES_200: {"totalTasks":156,"completedTasks":149,"failedTasks":2,"averageProcessingTime":85000,"currentLoad":0.3}

---

EP: GET /processing/clients/{clientId}/history
DESC: Get processing history for a client with pagination.
IN: params:{clientId:str!}, query:{limit:int, offset:int}
OUT: 200:{tasks:arr[obj], total:int}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/processing/clients/client-123/history?limit=10&offset=0" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"tasks":[{"id":"task-123","clientId":"client-123","type":"statement_parse","status":"completed","progress":100,"startTime":"2024-01-15T10:00:00Z","endTime":"2024-01-15T10:05:00Z"}],"total":45}

---

EP: GET /api/processing/tasks/{taskId}/stream
DESC: Server-sent events stream for real-time processing updates.
IN: params:{taskId:str!}
OUT: 200:{stream}
ERR: {"401":"Unauthorized", "404":"Task not found", "500":"Internal server error"}
EX_REQ: curl -X GET /api/processing/tasks/task-123/stream -H "Authorization: Bearer eyJ..." -H "Accept: text/event-stream"
EX_RES_200: {stream}

---

EP: GET /processing/tasks/{taskId}/logs
DESC: Get processing logs for a specific task.
IN: params:{taskId:str!}, query:{level:str}
OUT: 200:arr[str]
ERR: {"401":"Unauthorized", "404":"Task not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/processing/tasks/task-123/logs?level=info" -H "Authorization: Bearer eyJ..."
EX_RES_200: ["[INFO] Task started at 2024-01-15T10:00:00Z","[INFO] File validation completed successfully","[INFO] Found 3 PDF documents to process"]

## Analytics APIs

EP: GET /analytics/overview/{clientId}
DESC: Get comprehensive analytics overview for a client.
IN: params:{clientId:str!}, query:{startDate:str, endDate:str, categories:arr[str], transactionTypes:arr[str], minAmount:float, maxAmount:float}
OUT: 200:{totalInflow:float, totalOutflow:float, netCashFlow:float, averageDailyBalance:float, liquidityRatio:float, idleBalance:float, transactionCount:int, period:obj{startDate:str, endDate:str}}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/overview/client-123?startDate=2024-01-01&endDate=2024-01-31" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"totalInflow":500000.00,"totalOutflow":350000.00,"netCashFlow":150000.00,"averageDailyBalance":175000.00,"liquidityRatio":1.43,"idleBalance":25000.00,"transactionCount":247,"period":{"startDate":"2024-01-01","endDate":"2024-01-31"}}

---

EP: GET /analytics/cashflow/{clientId}
DESC: Get cash flow data for a client with specified period granularity.
IN: params:{clientId:str!}, query:{period:str}
OUT: 200:arr[obj{date:str, inflow:float, outflow:float, balance:float, netFlow:float}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/cashflow/client-123?period=daily" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"date":"2024-01-15","inflow":25000.00,"outflow":18000.00,"balance":175000.00,"netFlow":7000.00}]

---

EP: GET /analytics/categories/{clientId}
DESC: Get transaction category breakdown for a client.
IN: params:{clientId:str!}, query:{startDate:str, endDate:str}
OUT: 200:arr[obj{category:str, amount:float, count:int, percentage:float, trend:str}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/categories/client-123?startDate=2024-01-01&endDate=2024-01-31" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"category":"Operating Expenses","amount":125000.00,"count":45,"percentage":35.7,"trend":"up"}]

---

EP: GET /analytics/liquidity/{clientId}
DESC: Get liquidity analysis for a client.
IN: params:{clientId:str!}
OUT: 200:{averageBalance:float, minimumBalance:float, maximumBalance:float, volatility:float, idleDays:int, liquidityScore:float, thresholdExceeded:bool, thresholdAmount:float}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /analytics/liquidity/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"averageBalance":175000.00,"minimumBalance":50000.00,"maximumBalance":300000.00,"volatility":0.15,"idleDays":5,"liquidityScore":8.5,"thresholdExceeded":false,"thresholdAmount":25000.00}

---

EP: GET /analytics/patterns/{clientId}
DESC: Get spending patterns analysis for a client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{category:str, subcategory:str, averageAmount:float, frequency:str, seasonality:str, vendors:arr[obj{vendorName:str, totalAmount:float, transactionCount:int, percentage:float, paymentMethods:arr[str]}]}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /analytics/patterns/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"category":"Utilities","subcategory":"Electric","averageAmount":2500.00,"frequency":"monthly","seasonality":"medium","vendors":[{"vendorName":"Electric Co","totalAmount":30000.00,"transactionCount":12,"percentage":85.7,"paymentMethods":["ACH"]}]}]

---

EP: GET /analytics/summary/{clientId}
DESC: Get complete analytics summary for a client.
IN: params:{clientId:str!}, query:{startDate:str, endDate:str}
OUT: 200:{metrics:obj, cashFlow:arr[obj], categories:arr[obj], liquidity:obj, patterns:arr[obj], trends:obj{inflow:arr[obj], outflow:arr[obj], balance:arr[obj]}}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/summary/client-123?startDate=2024-01-01&endDate=2024-01-31" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"metrics":{},"cashFlow":[],"categories":[],"liquidity":{},"patterns":[],"trends":{"inflow":[],"outflow":[],"balance":[]}}

---

EP: GET /analytics/export/{clientId}
DESC: Export analytics data in specified format.
IN: params:{clientId:str!}, query:{format:str!, startDate:str, endDate:str}
OUT: 200:{blob}
ERR: {"400":"Invalid format", "401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/export/client-123?format=csv&startDate=2024-01-01&endDate=2024-01-31" -H "Authorization: Bearer eyJ..."
EX_RES_200: {blob}

---

EP: GET /analytics/vendors/{clientId}
DESC: Get vendor analysis for a client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{vendorName:str, totalAmount:float, transactionCount:int, percentage:float, paymentMethods:arr[str]}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /analytics/vendors/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"vendorName":"ABC Supplier","totalAmount":45000.00,"transactionCount":15,"percentage":25.7,"paymentMethods":["ACH","Check"]}]

---

EP: GET /analytics/trends/{clientId}
DESC: Get trend analysis for specific metrics.
IN: params:{clientId:str!}, query:{metric:str!, period:str}
OUT: 200:arr[obj{period:str, value:float, change:float, changePercent:float}]
ERR: {"400":"Invalid metric", "401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/trends/client-123?metric=inflow&period=12m" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"period":"2024-01","value":500000.00,"change":25000.00,"changePercent":5.26}]

## Recommendation APIs

EP: GET /recommendations/{clientId}
DESC: Get all recommendations for a client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{id:str, clientId:str, productId:str, product:obj, priority:str, rationale:obj, estimatedBenefit:obj, implementation:obj, supportingData:arr[obj], confidence:float, status:str, createdAt:str, reviewedBy:str, reviewedAt:str, notes:str}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /recommendations/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"rec-456","clientId":"client-123","productId":"prod-789","product":{},"priority":"high","rationale":{},"estimatedBenefit":{},"implementation":{},"supportingData":[],"confidence":0.85,"status":"pending","createdAt":"2024-01-15T10:00:00Z","reviewedBy":"","reviewedAt":"","notes":""}]

---

EP: POST /recommendations/generate
DESC: Generate new recommendations for a client.
IN: body:{clientId:str!}
OUT: 202:{taskId:str}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X POST /recommendations/generate -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"clientId":"client-123"}'
EX_RES_202: {"taskId":"rec-task-456"}

---

EP: GET /recommendations/detail/{recommendationId}
DESC: Get detailed information about a specific recommendation.
IN: params:{recommendationId:str!}
OUT: 200:{id:str, clientId:str, productId:str, product:obj, priority:str, rationale:obj, estimatedBenefit:obj, implementation:obj, supportingData:arr[obj], confidence:float, status:str, createdAt:str, reviewedBy:str, reviewedAt:str, notes:str}
ERR: {"401":"Unauthorized", "404":"Recommendation not found", "500":"Internal server error"}
EX_REQ: curl -X GET /recommendations/detail/rec-456 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"id":"rec-456","clientId":"client-123","productId":"prod-789","product":{},"priority":"high","rationale":{},"estimatedBenefit":{},"implementation":{},"supportingData":[],"confidence":0.85,"status":"pending","createdAt":"2024-01-15T10:00:00Z","reviewedBy":"","reviewedAt":"","notes":""}

---

EP: POST /recommendations/feedback
DESC: Provide feedback on a recommendation.
IN: body:{recommendationId:str!, feedback:str!, reason:str, modifications:str, implementationDate:str}
OUT: 200:{}
ERR: {"400":"Invalid feedback data", "401":"Unauthorized", "404":"Recommendation not found", "500":"Internal server error"}
EX_REQ: curl -X POST /recommendations/feedback -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"recommendationId":"rec-456","feedback":"accepted","reason":"Excellent fit for our needs"}'
EX_RES_200: {}

---

EP: POST /recommendations/{recommendationId}/approve
DESC: Approve a recommendation for implementation.
IN: params:{recommendationId:str!}, body:{reviewerId:str!, comments:str}
OUT: 200:{}
ERR: {"401":"Unauthorized", "404":"Recommendation not found", "500":"Internal server error"}
EX_REQ: curl -X POST /recommendations/rec-456/approve -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"reviewerId":"user-123","comments":"Approved for Q2 implementation"}'
EX_RES_200: {}

---

EP: POST /recommendations/{recommendationId}/reject
DESC: Reject a recommendation with reason.
IN: params:{recommendationId:str!}, body:{reviewerId:str!, reason:str!}
OUT: 200:{}
ERR: {"401":"Unauthorized", "404":"Recommendation not found", "500":"Internal server error"}
EX_REQ: curl -X POST /recommendations/rec-456/reject -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"reviewerId":"user-123","reason":"Not aligned with current strategy"}'
EX_RES_200: {}

---

EP: GET /products/catalog
DESC: Get all available treasury products.
IN: {}
OUT: 200:arr[obj{id:str, name:str, category:str, description:str, features:arr[str], eligibilityCriteria:obj, pricing:obj, benefits:arr[obj], riskLevel:str, liquidityFeatures:arr[str]}]
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET /products/catalog -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"prod-789","name":"High-Yield Savings","category":"investment","description":"Premium savings account with competitive rates","features":["Online access","Mobile app"],"eligibilityCriteria":{"minimumBalance":10000},"pricing":{"monthlyFee":0,"yieldRate":0.045},"benefits":[{"type":"yield_improvement","description":"Higher interest rates","estimatedValue":450,"unit":"dollars"}],"riskLevel":"low","liquidityFeatures":["Same-day access"]}]

---

EP: GET /products/{productId}
DESC: Get detailed information about a specific product.
IN: params:{productId:str!}
OUT: 200:{id:str, name:str, category:str, description:str, features:arr[str], eligibilityCriteria:obj, pricing:obj, benefits:arr[obj], riskLevel:str, liquidityFeatures:arr[str]}
ERR: {"401":"Unauthorized", "404":"Product not found", "500":"Internal server error"}
EX_REQ: curl -X GET /products/prod-789 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"id":"prod-789","name":"High-Yield Savings","category":"investment","description":"Premium savings account with competitive rates","features":["Online access","Mobile app"],"eligibilityCriteria":{"minimumBalance":10000},"pricing":{"monthlyFee":0,"yieldRate":0.045},"benefits":[{"type":"yield_improvement","description":"Higher interest rates","estimatedValue":450,"unit":"dollars"}],"riskLevel":"low","liquidityFeatures":["Same-day access"]}

---

EP: GET /recommendations/summary/{clientId}
DESC: Get recommendation summary statistics for a client.
IN: params:{clientId:str!}
OUT: 200:{totalRecommendations:int, highPriorityCount:int, totalEstimatedSavings:float, categoryCounts:obj, statusCounts:obj}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /recommendations/summary/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"totalRecommendations":8,"highPriorityCount":3,"totalEstimatedSavings":15000.00,"categoryCounts":{"cash_management":3,"investment":2,"credit":1},"statusCounts":{"pending":5,"approved":2,"implemented":1}}

---

EP: PATCH /recommendations/{recommendationId}/priority
DESC: Update recommendation priority level.
IN: params:{recommendationId:str!}, body:{priority:str!}
OUT: 200:{}
ERR: {"400":"Invalid priority level", "401":"Unauthorized", "404":"Recommendation not found", "500":"Internal server error"}
EX_REQ: curl -X PATCH /recommendations/rec-456/priority -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"priority":"high"}'
EX_RES_200: {}

---

EP: POST /recommendations/{recommendationId}/implement
DESC: Mark recommendation as implemented.
IN: params:{recommendationId:str!}, body:{implementationDate:str!, notes:str}
OUT: 200:{}
ERR: {"401":"Unauthorized", "404":"Recommendation not found", "500":"Internal server error"}
EX_REQ: curl -X POST /recommendations/rec-456/implement -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"implementationDate":"2024-02-01","notes":"Successfully implemented with treasury team"}'
EX_RES_200: {}

---

EP: GET /recommendations/export/{clientId}
DESC: Export recommendation report in specified format.
IN: params:{clientId:str!}, query:{format:str!}
OUT: 200:{blob}
ERR: {"400":"Invalid format", "401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/recommendations/export/client-123?format=pdf" -H "Authorization: Bearer eyJ..."
EX_RES_200: {blob}

---

EP: GET /recommendations/history/{clientId}
DESC: Get historical recommendations for a client.
IN: params:{clientId:str!}
OUT: 200:arr[obj{id:str, clientId:str, productId:str, product:obj, priority:str, rationale:obj, estimatedBenefit:obj, implementation:obj, supportingData:arr[obj], confidence:float, status:str, createdAt:str, reviewedBy:str, reviewedAt:str, notes:str}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET /recommendations/history/client-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"rec-456","clientId":"client-123","productId":"prod-789","product":{},"priority":"high","rationale":{},"estimatedBenefit":{},"implementation":{},"supportingData":[],"confidence":0.85,"status":"implemented","createdAt":"2024-01-15T10:00:00Z","reviewedBy":"user-456","reviewedAt":"2024-01-20T14:30:00Z","notes":"Successfully implemented"}]

## User Management APIs

EP: GET /users
DESC: Retrieve paginated list of users.
IN: query:{page:int, limit:int, role:str}
OUT: 200:{users:arr[obj{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}], total:int, pages:int}
ERR: {"401":"Unauthorized", "403":"Forbidden", "500":"Internal server error"}
EX_REQ: curl -X GET "/users?page=1&limit=10&role=USER" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"users":[{"id":1,"email":"user@example.com","name":"John Doe","role":"USER","isEmailVerified":true,"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:00:00Z"}],"total":1,"pages":1}

---

EP: GET /users/{userId}
DESC: Get specific user details by ID.
IN: params:{userId:int!}
OUT: 200:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"401":"Unauthorized", "403":"Forbidden", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X GET /users/1 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"id":1,"email":"user@example.com","name":"John Doe","role":"USER","isEmailVerified":true,"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T10:00:00Z"}

---

EP: PUT /users/{userId}
DESC: Update user information.
IN: params:{userId:int!}, body:{name:str, email:str, role:str}
OUT: 200:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input data", "401":"Unauthorized", "403":"Forbidden", "404":"User not found", "409":"Email already exists", "500":"Internal server error"}
EX_REQ: curl -X PUT /users/1 -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"name":"John Smith","role":"ADMIN"}'
EX_RES_200: {"id":1,"email":"user@example.com","name":"John Smith","role":"ADMIN","isEmailVerified":true,"createdAt":"2024-01-15T10:00:00Z","updatedAt":"2024-01-15T11:00:00Z"}

---

EP: DELETE /users/{userId}
DESC: Delete a user account.
IN: params:{userId:int!}
OUT: 204:{}
ERR: {"401":"Unauthorized", "403":"Forbidden", "404":"User not found", "409":"Cannot delete user with active assignments", "500":"Internal server error"}
EX_REQ: curl -X DELETE /users/1 -H "Authorization: Bearer eyJ..."
EX_RES_204: {}

---

EP: POST /auth/send-verification-email
DESC: Send email verification to user.
IN: body:{email:str!}
OUT: 204:{}
ERR: {"400":"Invalid email", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/send-verification-email -H "Content-Type: application/json" -d '{"email":"user@example.com"}'
EX_RES_204: {}

---

EP: POST /auth/verify-email
DESC: Verify user email with token.
IN: body:{token:str!}
OUT: 204:{}
ERR: {"400":"Invalid token", "401":"Token expired", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/verify-email -H "Content-Type: application/json" -d '{"token":"verification-token"}'
EX_RES_204: {}

---

EP: POST /auth/forgot-password
DESC: Send password reset email.
IN: body:{email:str!}
OUT: 204:{}
ERR: {"400":"Invalid email", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/forgot-password -H "Content-Type: application/json" -d '{"email":"user@example.com"}'
EX_RES_204: {}

---

EP: POST /auth/reset-password
DESC: Reset password with token.
IN: body:{token:str!, password:str!}
OUT: 204:{}
ERR: {"400":"Invalid token or password", "401":"Token expired", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/reset-password -H "Content-Type: application/json" -d '{"token":"reset-token","password":"newpassword123"}'
EX_RES_204: {}

---

EP: POST /auth/change-password
DESC: Change user password while authenticated.
IN: body:{oldPassword:str!, newPassword:str!}
OUT: 204:{}
ERR: {"400":"Invalid password", "401":"Unauthorized", "403":"Incorrect old password", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/change-password -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"oldPassword":"oldpass","newPassword":"newpass123"}'
EX_RES_204: {}

## Enhanced Analytics APIs

EP: GET /analytics/dashboard/{clientId}
DESC: Get comprehensive dashboard data with KPIs and visualizations.
IN: params:{clientId:str!}, query:{dateRange:str, compareMode:str}
OUT: 200:{metrics:obj{totalInflow:float, totalOutflow:float, netCashFlow:float, averageDailyBalance:float, liquidityRatio:float, idleBalance:float, transactionCount:int}, charts:obj{cashFlow:arr[obj], categories:arr[obj], trends:arr[obj]}, kpis:arr[obj{name:str, value:float, unit:str, trend:str, change:float}], period:obj{startDate:str, endDate:str}}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/dashboard/client-123?dateRange=30d&compareMode=previous" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"metrics":{"totalInflow":500000.00,"totalOutflow":350000.00,"netCashFlow":150000.00,"averageDailyBalance":175000.00,"liquidityRatio":1.43,"idleBalance":25000.00,"transactionCount":247},"charts":{"cashFlow":[],"categories":[],"trends":[]},"kpis":[{"name":"Net Cash Flow","value":150000.00,"unit":"USD","trend":"up","change":5.2}],"period":{"startDate":"2024-01-01","endDate":"2024-01-31"}}

---

EP: GET /analytics/forecasting/{clientId}
DESC: Get cash flow forecasting and predictive analytics.
IN: params:{clientId:str!}, query:{forecastPeriod:str, confidenceLevel:float}
OUT: 200:{forecast:arr[obj{date:str, predictedInflow:float, predictedOutflow:float, predictedBalance:float, confidence:float}], seasonality:obj{patterns:arr[obj], factors:arr[obj]}, recommendations:arr[str]}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/forecasting/client-123?forecastPeriod=90d&confidenceLevel=0.85" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"forecast":[{"date":"2024-02-01","predictedInflow":45000.00,"predictedOutflow":38000.00,"predictedBalance":182000.00,"confidence":0.87}],"seasonality":{"patterns":[],"factors":[]},"recommendations":["Consider investing excess cash during low-activity periods"]}

---

EP: GET /analytics/benchmarking/{clientId}
DESC: Compare client metrics against industry benchmarks.
IN: params:{clientId:str!}, query:{industry:str, businessSegment:str}
OUT: 200:{clientMetrics:obj, industryBenchmarks:obj, percentileRank:int, comparisonAreas:arr[obj{metric:str, clientValue:float, benchmarkValue:float, performance:str}]}
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/analytics/benchmarking/client-123?industry=technology&businessSegment=medium" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"clientMetrics":{},"industryBenchmarks":{},"percentileRank":75,"comparisonAreas":[{"metric":"Liquidity Ratio","clientValue":1.43,"benchmarkValue":1.25,"performance":"above_average"}]}

## Advanced File Processing APIs

EP: POST /statements/validate-bulk
DESC: Validate multiple statement files before processing.
IN: body:{fileIds:arr[str]!, validationRules:obj}
OUT: 200:arr[obj{fileId:str, isValid:bool, errors:arr[str], warnings:arr[str], metadata:obj{accountsFound:arr[str], dateRange:obj, transactionCount:int}}]
ERR: {"400":"Invalid file IDs", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /statements/validate-bulk -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"fileIds":["stmt-456","stmt-789"],"validationRules":{"strictMode":true}}'
EX_RES_200: [{"fileId":"stmt-456","isValid":true,"errors":[],"warnings":["Date format inconsistency"],"metadata":{"accountsFound":["123456789"],"dateRange":{"start":"2024-01-01","end":"2024-01-31"},"transactionCount":247}}]

---

EP: GET /statements/processing-queue
DESC: Get current statement processing queue status.
IN: query:{status:str}
OUT: 200:{queue:arr[obj{fileId:str, fileName:str, clientId:str, status:str, position:int, estimatedWaitTime:int}], metrics:obj{queueLength:int, averageProcessingTime:int, systemLoad:float}}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET "/statements/processing-queue?status=pending" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"queue":[{"fileId":"stmt-456","fileName":"statement.pdf","clientId":"client-123","status":"pending","position":2,"estimatedWaitTime":120}],"metrics":{"queueLength":5,"averageProcessingTime":85,"systemLoad":0.6}}

---

EP: POST /statements/reprocess
DESC: Reprocess failed or corrupted statement files.
IN: body:{fileIds:arr[str]!, options:obj{forceReprocess:bool, preserveExisting:bool}}
OUT: 202:{taskIds:arr[str]}
ERR: {"400":"Invalid file IDs", "401":"Unauthorized", "409":"Files not eligible for reprocessing", "500":"Internal server error"}
EX_REQ: curl -X POST /statements/reprocess -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"fileIds":["stmt-456"],"options":{"forceReprocess":true,"preserveExisting":false}}'
EX_RES_202: {"taskIds":["task-789"]}

---

EP: GET /statements/data-quality/{fileId}
DESC: Get detailed data quality assessment for processed statement.
IN: params:{fileId:str!}
OUT: 200:{overallScore:float, dimensions:obj{completeness:float, accuracy:float, consistency:float, validity:float}, issues:arr[obj{type:str, severity:str, description:str, affectedRecords:int, suggestions:arr[str]}], recommendations:arr[str]}
ERR: {"401":"Unauthorized", "404":"Statement file not found", "500":"Internal server error"}
EX_REQ: curl -X GET /statements/data-quality/stmt-456 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"overallScore":8.5,"dimensions":{"completeness":0.95,"accuracy":0.88,"consistency":0.92,"validity":0.85},"issues":[{"type":"missing_category","severity":"medium","description":"15 transactions missing category classification","affectedRecords":15,"suggestions":["Run auto-categorization","Manual review required"]}],"recommendations":["Improve statement quality by requesting standardized format"]}

## Workflow and Approval APIs

EP: GET /workflow/tasks
DESC: Get workflow tasks for current user.
IN: query:{status:str, type:str, assignedTo:str}
OUT: 200:arr[obj{id:str, type:str, status:str, priority:str, clientId:str, clientName:str, assignedTo:str, createdAt:str, dueDate:str, metadata:obj}]
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET "/workflow/tasks?status=pending&type=approval" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"workflow-123","type":"recommendation_approval","status":"pending","priority":"high","clientId":"client-123","clientName":"ABC Corp","assignedTo":"user-456","createdAt":"2024-01-15T10:00:00Z","dueDate":"2024-01-17T10:00:00Z","metadata":{}}]

---

EP: POST /workflow/tasks/{taskId}/complete
DESC: Complete a workflow task with resolution.
IN: params:{taskId:str!}, body:{resolution:str!, comments:str, attachments:arr[str]}
OUT: 200:{nextSteps:arr[obj], notifications:arr[obj]}
ERR: {"400":"Invalid resolution", "401":"Unauthorized", "404":"Task not found", "409":"Task cannot be completed", "500":"Internal server error"}
EX_REQ: curl -X POST /workflow/tasks/workflow-123/complete -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"resolution":"approved","comments":"Looks good for implementation"}'
EX_RES_200: {"nextSteps":[{"type":"implementation","assignedTo":"user-789","dueDate":"2024-01-20T10:00:00Z"}],"notifications":[]}

---

EP: GET /workflow/audit/{clientId}
DESC: Get audit trail for client workflow activities.
IN: params:{clientId:str!}, query:{startDate:str, endDate:str, activityType:str}
OUT: 200:arr[obj{id:str, timestamp:str, activityType:str, userId:str, userName:str, description:str, changes:arr[obj], metadata:obj}]
ERR: {"401":"Unauthorized", "404":"Client not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/workflow/audit/client-123?startDate=2024-01-01&activityType=approval" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"id":"audit-456","timestamp":"2024-01-15T10:30:00Z","activityType":"recommendation_approved","userId":"user-456","userName":"Jane Smith","description":"Approved high-yield savings recommendation","changes":[],"metadata":{}}]

## System Administration APIs

EP: GET /admin/system/health
DESC: Get comprehensive system health status.
IN: {}
OUT: 200:{status:str, version:str, uptime:int, services:obj{database:obj{status:str, responseTime:int}, storage:obj{status:str, usage:float}, processing:obj{status:str, queueLength:int}}, metrics:obj{activeUsers:int, totalClients:int, processingLoad:float}}
ERR: {"401":"Unauthorized", "403":"Admin access required", "500":"Internal server error"}
EX_REQ: curl -X GET /admin/system/health -H "Authorization: Bearer eyJ..."
EX_RES_200: {"status":"healthy","version":"1.0.0","uptime":86400,"services":{"database":{"status":"connected","responseTime":15},"storage":{"status":"available","usage":0.65},"processing":{"status":"operational","queueLength":3}},"metrics":{"activeUsers":25,"totalClients":150,"processingLoad":0.3}}

---

EP: GET /admin/system/logs
DESC: Get system logs with filtering capabilities.
IN: query:{level:str, service:str, startTime:str, endTime:str, limit:int}
OUT: 200:arr[obj{timestamp:str, level:str, service:str, message:str, metadata:obj, traceId:str}]
ERR: {"401":"Unauthorized", "403":"Admin access required", "500":"Internal server error"}
EX_REQ: curl -X GET "/admin/system/logs?level=error&service=processing&limit=50" -H "Authorization: Bearer eyJ..."
EX_RES_200: [{"timestamp":"2024-01-15T10:00:00Z","level":"error","service":"processing","message":"Failed to parse statement file","metadata":{"fileId":"stmt-789","error":"Invalid format"},"traceId":"trace-123"}]

---

EP: POST /admin/system/maintenance
DESC: Trigger system maintenance operations.
IN: body:{operation:str!, parameters:obj}
OUT: 202:{taskId:str, estimatedDuration:int}
ERR: {"400":"Invalid operation", "401":"Unauthorized", "403":"Admin access required", "500":"Internal server error"}
EX_REQ: curl -X POST /admin/system/maintenance -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." -d '{"operation":"database_cleanup","parameters":{"retentionDays":30}}'
EX_RES_202: {"taskId":"maint-456","estimatedDuration":600}

---

EP: GET /admin/analytics/usage
DESC: Get system usage analytics and metrics.
IN: query:{period:str, granularity:str}
OUT: 200:{usage:arr[obj{timestamp:str, activeUsers:int, apiCalls:int, storageUsed:int, processingJobs:int}], trends:obj{userGrowth:float, apiGrowth:float, storageGrowth:float}, topUsers:arr[obj{userId:str, userName:str, apiCalls:int, storageUsed:int}]}
ERR: {"401":"Unauthorized", "403":"Admin access required", "500":"Internal server error"}
EX_REQ: curl -X GET "/admin/analytics/usage?period=30d&granularity=daily" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"usage":[{"timestamp":"2024-01-15","activeUsers":25,"apiCalls":1250,"storageUsed":1048576,"processingJobs":15}],"trends":{"userGrowth":0.15,"apiGrowth":0.22,"storageGrowth":0.08},"topUsers":[{"userId":"user-123","userName":"John Doe","apiCalls":250,"storageUsed":204800}]}

## Real-time Updates and Notifications

EP: GET /notifications/stream
DESC: Server-sent events stream for real-time notifications.
IN: query:{types:arr[str]}
OUT: 200:{stream}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET "/notifications/stream?types=processing,recommendation" -H "Authorization: Bearer eyJ..." -H "Accept: text/event-stream"
EX_RES_200: {stream}

---

EP: GET /notifications
DESC: Get user notifications with pagination.
IN: query:{page:int, limit:int, read:bool, type:str}
OUT: 200:{notifications:arr[obj{id:str, type:str, title:str, message:str, data:obj, read:bool, createdAt:str}], total:int, unreadCount:int}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X GET "/notifications?page=1&limit=10&read=false" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"notifications":[{"id":"notif-123","type":"processing_complete","title":"Statement Processing Complete","message":"Processing completed for ABC Corp statements","data":{"clientId":"client-123","taskId":"task-456"},"read":false,"createdAt":"2024-01-15T10:00:00Z"}],"total":5,"unreadCount":3}

---

EP: POST /notifications/{notificationId}/read
DESC: Mark notification as read.
IN: params:{notificationId:str!}
OUT: 200:{}
ERR: {"401":"Unauthorized", "404":"Notification not found", "500":"Internal server error"}
EX_REQ: curl -X POST /notifications/notif-123/read -H "Authorization: Bearer eyJ..."
EX_RES_200: {}

---

EP: POST /notifications/read-all
DESC: Mark all notifications as read for current user.
IN: {}
OUT: 200:{markedCount:int}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /notifications/read-all -H "Authorization: Bearer eyJ..."
EX_RES_200: {"markedCount":5}