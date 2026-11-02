# AWS CloudFormation Deployment for RecipeForge

This directory contains the production-grade AWS CloudFormation template and deployment guide to provision and launch **RecipeForge** on an Amazon Web Services (AWS) EC2 instance.

---

## 🏛️ Architecture Overview

The [`cloudformation.yaml`](cloudformation.yaml) template provisions:

- **Compute**: An Amazon EC2 instance (`t2.micro` by default, AWS Free Tier eligible).
- **Operating System**: **Amazon Linux 2**, dynamically resolved via AWS Systems Manager (SSM) Parameter Store (`/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`) for multi-region compatibility without hardcoded AMI IDs.
- **Storage**: 20 GB General Purpose SSD (`gp3`) root volume.
- **Security Group**:
  - Port `22` (TCP): SSH remote access.
  - Port `80` (TCP): Standard HTTP web traffic (transparently redirected to 8000 via `iptables`).
  - Port `8000` (TCP): RecipeForge application port (FastAPI backend + React SPA).
- **Automated Bootstrap (UserData)**:
  1. Updates system packages.
  2. Installs and starts Docker daemon.
  3. Installs Docker Compose and CLI plugin.
  4. Configures HTTP port redirection (`80 -> 8000`).
  5. Clones the GitHub repository (`main` branch).
  6. Launches the application stack with `docker compose up -d --build`.

---

## 📋 Prerequisites

1. **AWS Account**: Active AWS account with permissions for EC2 and CloudFormation.
2. **AWS CLI v2**: Installed and configured locally:
   ```bash
   aws configure
   ```
3. *(Optional)* **EC2 Key Pair**: An existing AWS EC2 Key Pair if you wish to enable SSH access.

---

## 🚀 Deployment Instructions

### Method 1: Deploy Using AWS CLI (Recommended)

#### 1. Create the CloudFormation Stack

Without an SSH key (web access only):
```bash
aws cloudformation create-stack \
  --stack-name recipeforge-production \
  --template-body file://cloudformation.yaml \
  --parameters ParameterKey=InstanceType,ParameterValue=t2.micro
```

With an existing SSH Key Pair:
```bash
aws cloudformation create-stack \
  --stack-name recipeforge-production \
  --template-body file://cloudformation.yaml \
  --parameters \
    ParameterKey=InstanceType,ParameterValue=t2.micro \
    ParameterKey=KeyName,ParameterValue=my-ec2-keypair
```

#### 2. Wait for Stack Creation to Complete

```bash
aws cloudformation wait stack-create-complete \
  --stack-name recipeforge-production
```

#### 3. Retrieve Application URLs and Public IP

```bash
aws cloudformation describe-stacks \
  --stack-name recipeforge-production \
  --query "Stacks[0].Outputs" \
  --output table
```

Output example:
```
------------------------------------------------------------------------------------------------------
|                                          DescribeStacks                                            |
+------------------+------------------------------------------------------+--------------------------+
|   OutputKey      |                     OutputValue                      |       Description        |
+------------------+------------------------------------------------------+--------------------------+
| AppUrlPort80     | http://54.210.12.34                                  | Standard HTTP URL        |
| AppUrlPort8000   | http://54.210.12.34:8000                             | Direct App URL on 8000   |
| PublicIp         | 54.210.12.34                                         | Public IPv4 address      |
| SSHAccessCommand | ssh -i <your-key.pem> ec2-user@54.210.12.34          | SSH connection command   |
+------------------+------------------------------------------------------+--------------------------+
```

---

### Method 2: Deploy Using AWS Management Console

1. Open the [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation).
2. Click **Create stack** > **With new resources (standard)**.
3. Under **Prerequisite - Prepare template**, select **Template is ready**.
4. Under **Specify template**, select **Upload a template file** and upload `cloudformation.yaml`. Click **Next**.
5. Set **Stack name** to `recipeforge-production`.
6. Configure parameters:
   - **InstanceType**: `t2.micro` (or `t3.micro`).
   - **KeyName**: Select your EC2 Key Pair (or leave empty if SSH is not needed).
   - **RepositoryUrl**: Default is `https://github.com/RusKZUV/RecipeForge.git`.
   - **Branch**: Default is `main`.
7. Click **Next** through Options, review settings, and click **Submit**.
8. Once the stack status changes to `CREATE_COMPLETE`, view the **Outputs** tab for the live application URL.

---

## 🔍 Verification & Health Check

1. **Open the Web Application**:
   Navigate to `http://<Public-IP>:8000` or `http://<Public-IP>` in your web browser.
2. **API Health Check**:
   ```bash
   curl http://<Public-IP>/health
   ```
   Expected response:
   ```json
   {"status":"ok","app":"RecipeForge","version":"0.1.0"}
   ```
3. **Inspect Server Logs via SSH**:
   ```bash
   ssh -i <your-key.pem> ec2-user@<Public-IP>
   ```
   - Check automated provisioning log:
     ```bash
     cat /var/log/user-data.log
     ```
   - Check container status:
     ```bash
     cd /opt/recipeforge
     docker compose ps
     ```
   - Check live application logs:
     ```bash
     docker compose logs -f app
     ```

---

## 🔄 Updating the Deployment

To pull the latest code updates on the running instance:

```bash
ssh -i <your-key.pem> ec2-user@<Public-IP>
cd /opt/recipeforge
git pull origin main
docker compose up -d --build
```

---

## 🧹 Teardown & Resource Cleanup

To permanently delete the instance, security group, and associated resources to prevent ongoing cloud costs:

```bash
aws cloudformation delete-stack --stack-name recipeforge-production
aws cloudformation wait stack-delete-complete --stack-name recipeforge-production
```
