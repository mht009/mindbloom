Awesome! 🚀  
Let’s go step-by-step on **how to install only the Docker CLI** (without heavy Docker Desktop) on **Windows**, by using **WSL2** (Windows Subsystem for Linux 2).

---

### 🛠 Here's the Plan:

1. Install **WSL2** (if not already).
2. Install a Linux distribution (like **Ubuntu**) inside WSL.
3. Inside WSL, install **Docker Engine** (CLI + daemon) manually.
4. Use `docker` commands normally from WSL terminal.

---

### 1. Install WSL2

Open **PowerShell as Administrator** and run:

```bash
wsl --install
```

(If it says WSL already installed, you can skip.)

You can also check:

```bash
wsl --list --verbose
```

to see if WSL2 is active.

**Tip:** Make sure you’re using **WSL version 2** (not 1), because Docker needs WSL2.

---

### 2. Install a Linux Distro

Still in PowerShell, you can install Ubuntu like this:

```bash
wsl --install -d Ubuntu
```

It'll download from Microsoft Store and set up automatically.

---

### 3. Install Docker Engine inside Ubuntu

Once you open Ubuntu from Windows (it will ask you to set username and password for Linux), run the following commands **inside Ubuntu**:

```bash
# Update packages
sudo apt update
sudo apt upgrade -y

# Install packages to allow apt to use a repository over HTTPS
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Add Docker’s official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update again
sudo apt update

# Install Docker Engine
sudo apt install docker-ce docker-ce-cli containerd.io -y
```

---

### 4. Enable and Run Docker

After installing, start Docker daemon manually:

```bash
sudo service docker start
```

To enable Docker to start on boot using `systemctl`, you would run the following command with `sudo`:

```bash
sudo systemctl enable docker
```

This command will enable Docker so that it automatically starts when your system boots up.

You can now use:

```bash
docker --version
docker run hello-world
```

To avoid typing `sudo` every time:

```bash
sudo usermod -aG docker $USER
```

Then restart your WSL/Ubuntu window.

---

### ✨ Bonus: Access Docker from Windows Terminal

You can open **Ubuntu** inside **Windows Terminal** and directly use `docker` commands.

**Note:** Docker will only run when Ubuntu WSL is running, since the daemon (`dockerd`) is inside Linux.

---

### In short

✅ No Docker Desktop needed  
✅ Fully working lightweight Docker CLI  
✅ More Linux-like experience

## Redis installation

Using WSL(Windows subsystem for linux), since redis has no official installation for windows, therefore used WSL ubuntu and running `redis server` on docker container and mapped the port to 0.0.0.0:6573, thereby the application in windows can use it.

`docker run -d -p 6379:6379 --name redis-server redis`

## elastic search db installation

Using WSL(Windows subsystem for linux), and running `elastic search server` on docker container and mapped the port to 0.0.0.0:9200, thereby the application in windows can use it.

`docker run -d -p 9200:9200 --name elasticsearch -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.4.0`
