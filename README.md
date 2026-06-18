# VS Fashion 👗

A full-stack e-commerce web application for **VS Fashion** — a modern Indian fashion brand. The platform supports end-to-end online shopping with a customer-facing storefront and a powerful admin panel for managing the entire business.

---

## 🌐 Live Demo

- **Website:** [vs-fashion.com](https://vs-fashion.com)
- **API Base URL:** `https://vs-fashion.com/api`

---

## 📦 Project Structure

```
vs-fashion/
├── backend/          # FastAPI Python backend
│   ├── server.py     # Main API server (all routes & logic)
│   ├── requirements.txt
│   ├── seed_data.py  # Initial product/collection seeder
│   ├── seed_policies.py
│   └── uploads/      # Local image uploads (fallback)
├── frontend/         # React.js frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── customer/   # Customer-facing pages
│   │   │   └── admin/      # Admin panel pages
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # Customer & Admin layouts
│   │   ├── store/          # Zustand global state
│   │   └── hooks/          # Custom React hooks
│   └── public/
├── vs-backend.service    # systemd service for backend
├── vs-frontend.nginx     # Nginx config for serving frontend + proxying API
└── README.md
```

---

## ✨ Features

### 🛍️ Customer Storefront
- **Home Page** — Hero banners, featured collections, trending products, new arrivals & best sellers
- **Collections** — Browse products by category/collection
- **Product Detail** — Multi-image gallery, size selection, size guide, add to cart
- **New Arrivals & Best Sellers** — Dedicated listing pages
- **Shopping Cart** — Persistent cart with quantity management
- **Checkout** — Address selection, Razorpay payment integration
- **Customer Dashboard** — Order history, profile management, multiple saved addresses
- **About Us, Contact, FAQ** — Brand info pages
- **Policy Pages** — Privacy Policy, Refund Policy, Shipping Policy, Terms & Conditions

### 🔐 Authentication
- User **Register / Login** with JWT tokens
- Secure **Admin Login** (separate admin accounts)
- Protected routes for checkout, dashboard, and admin panel

### 🛠️ Admin Panel
| Page | Features |
|---|---|
| **Dashboard** | Overview & quick stats |
| **Collections** | Create, edit, delete collections; toggle homepage visibility |
| **Products** | Add/edit products with multi-image upload, sizes, pricing, discount, tags (trending/new/best-seller) |
| **Inventory** | Track and update stock per product per size |
| **Orders** | View all orders, update order status, customer details |
| **Customers** | View registered customers |
| **Content** | Edit dynamic content pages (About Us, FAQ, policies etc.) |

### 💳 Payments
- Integrated with **Razorpay** for secure online payments
- Order confirmation with email notifications (SMTP via Gmail)
- WhatsApp notification support (configurable)

### 📸 Image Management
- **AWS S3** upload support for product images
- Fallback to local filesystem storage
- **Server-side image compression** using Pillow (auto-compress to ≤ 3 MB, LANCZOS quality scaling)
- Cloudflare R2 compatible via custom S3 endpoint

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **MongoDB (Atlas)** | Database via Motor (async driver) |
| **Pydantic** | Data validation & schemas |
| **python-jose** | JWT authentication |
| **passlib / bcrypt** | Password hashing |
| **boto3** | AWS S3 image uploads |
| **razorpay** | Payment gateway integration |
| **aiosmtplib** | Async email (SMTP) |
| **Pillow** | Server-side image compression |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router v7** | Client-side routing |
| **Zustand** | Global state management |
| **Tailwind CSS v3** | Utility-first styling |
| **Radix UI** | Accessible headless components |
| **Framer Motion** | Animations |
| **Recharts** | Charts (admin analytics) |
| **React Hook Form + Zod** | Form validation |
| **Axios** | HTTP requests |
| **Lucide React** | Icons |
| **Embla Carousel** | Product image carousel |
| **Lenis** | Smooth scrolling |
| **Sonner** | Toast notifications |

### Infrastructure
| Service | Role |
|---|---|
| **AWS EC2** | Backend + frontend hosting |
| **AWS S3** | Product image storage |
| **MongoDB Atlas** | Cloud database |
| **Nginx** | Reverse proxy + static file serving |
| **systemd** | Backend process management |

---

## 🎨 Design System

| Token | Value |
|---|---|
| **Primary (Maroon)** | `#8B1B4A` |
| **Primary Hover** | `#A4305E` |
| **Secondary** | `#C4969C` |
| **Background** | `#FAFAFA` |
| **Text Dark** | `#1A1A1A` |
| **Text Gray** | `#6B7280` |
| **Heading Font** | Playfair Display (serif) |
| **Body Font** | Lato (sans-serif) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & Yarn
- MongoDB Atlas account (or local MongoDB)

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv myenv
myenv\Scripts\activate        # Windows
# source myenv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, AWS, Razorpay, SMTP credentials

# Run the development server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Set REACT_APP_BACKEND_URL=http://localhost:8000

# Start development server
yarn start
```

The app will be available at `http://localhost:3000`

---

### Seed Initial Data (Optional)

```bash
cd backend
python seed_data.py      # Seeds sample collections & products
python seed_policies.py  # Seeds policy/content pages
```

---

## 🌍 Deployment (Production)

The project is deployed on **AWS EC2** with Nginx as a reverse proxy.

### Backend (systemd service)
```bash
# Copy service file
sudo cp vs-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable vs-backend
sudo systemctl start vs-backend
```

### Frontend (Nginx)
```bash
# Build the React app
cd frontend && yarn build

# Copy Nginx config
sudo cp vs-frontend.nginx /etc/nginx/sites-available/vs-fashion
sudo ln -s /etc/nginx/sites-available/vs-fashion /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

The Nginx config:
- Proxies `/api/` requests → FastAPI backend on port `8000`
- Serves the React build (`/home/ubuntu/frontend/build`) for all other routes

---

## 🔌 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/admin/login` | Admin login |
| `GET` | `/api/collections` | List active collections |
| `POST` | `/api/collections` | Create collection (admin) |
| `GET` | `/api/products` | List products (filterable) |
| `POST` | `/api/products` | Create product (admin) |
| `POST` | `/api/products/upload` | Upload product image (admin) |
| `GET` | `/api/products/{id}` | Get product details |
| `GET` | `/api/cart` | Get user cart |
| `POST` | `/api/cart` | Update cart |
| `POST` | `/api/orders` | Place an order |
| `GET` | `/api/orders` | List orders (user/admin) |
| `PUT` | `/api/orders/{id}/status` | Update order status (admin) |
| `GET` | `/api/user/addresses` | Get saved addresses |
| `POST` | `/api/user/addresses` | Add new address |
| `DELETE` | `/api/user/addresses/{id}` | Remove address |
| `POST` | `/api/payment/create` | Create Razorpay order |
| `POST` | `/api/payment/verify` | Verify payment signature |
| `GET` | `/api/banners` | Get homepage banners |
| `GET` | `/api/health` | Health check |

---

## 📄 Environment Variables

### Backend (`.env`)

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | MongoDB database name |
| `JWT_SECRET_KEY` | Secret for JWT signing |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_PORT` | Email SMTP port |
| `SMTP_USER` | SMTP email username |
| `SMTP_PASSWORD` | SMTP email password |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (e.g. `ap-south-1`) |
| `AWS_S3_BUCKET_NAME` | S3 bucket for product images |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `WHATSAPP_API_KEY` | WhatsApp Business API key (optional) |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `REACT_APP_BACKEND_URL` | Backend API base URL |

---

## 📁 Key Pages

### Customer
| Route | Page |
|---|---|
| `/` | Home |
| `/new-arrivals` | New Arrivals |
| `/best-sellers` | Best Sellers |
| `/collection/:id` | Collection Products |
| `/product/:id` | Product Detail |
| `/cart` | Shopping Cart |
| `/checkout` | Checkout (auth required) |
| `/dashboard` | Customer Dashboard (auth required) |
| `/about` | About Us |
| `/contact` | Contact Us |
| `/faq` | FAQ |
| `/privacy` | Privacy Policy |
| `/refund` | Refund Policy |
| `/shipping` | Shipping Policy |
| `/terms` | Terms & Conditions |

### Admin
| Route | Page |
|---|---|
| `/admin/login` | Admin Login |
| `/admin` | Dashboard |
| `/admin/collections` | Collection Management |
| `/admin/products` | Product Management |
| `/admin/inventory` | Inventory Management |
| `/admin/orders` | Order Management |
| `/admin/customers` | Customer Management |
| `/admin/content` | Content Management |

---

## 📧 Contact

- **Business Email:** vsfashiiiion@gmail.com  
- **WhatsApp:** +91 84219 68737

---

## 📝 License

This project is proprietary. All rights reserved © VS Fashion 2025.
