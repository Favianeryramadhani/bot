# Gunakan Node.js 20
FROM node:20

# Set working directory
WORKDIR /app

# Copy file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy semua file proyek ke image
COPY . .

# Expose port (jika pakai Express atau sejenis, sesuaikan kalau tidak perlu)
EXPOSE 3000

# Jalankan bot
CMD ["npm", "start"]
