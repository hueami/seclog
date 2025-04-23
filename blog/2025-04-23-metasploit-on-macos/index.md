---
slug: metasploit_macos
title: Metasploit on MacOS
authors: [hueami]
tags: [tooling, metasploit, macos]
comments: true
---

## Problems using Metasploit on MacOS
I use a MacBook Pro (M2) in a professional context and a MacBook Pro (2019, Intel) in a personal context, and I have consistently encountered the issue that reverse shells from Metasploit handlers were not caught on both devices. In this article, I describe how I analyzed the problem, narrowed it down, and found a solution that works for my purposes.

<!-- truncate -->

## Problem Description
A typical approach in CTFs and penetration tests is to exploit a vulnerability to deploy a reverse or staged shell on a machine, execute it, and then catch the shell with a listener, such as netcat or a Metasploit handler. I often had the problem that I could not catch the reverse shell; no connection was established. Over time, I noticed that this seems to affect only Metasploit handlers - recently, it was the `/exploit/multi/handler` with a `windows/x64/meterpreter_reverse_tcp` payload. That prompted me to delve deeper and analyze the problem.

## Problem Analysis
Since the problem last occurred on my (managed) work laptop, I initially feared that some endpoint-security program was blocking the connection. I recreated the situation on my personal MacBook Pro and found that the problem also existed there. To test this, I deactivated the MacOS firewall, and lo and behold: Metasploit was suddenly able to catch the reverse shell. So, the problem was the MacOS firewall. However, I do not have permission to disable the MacOS firewall on my managed work laptop - and besides, I didn't want to disable the firewall entirely just because of Metasploit. However, you can add programs in the MacOS settings under Firewall in `Options` by clicking `+`, which allows or blocks access. This was also possible on my managed work laptop.

### Attempt 1: Allow Metasploit in the Firewall
First, I added `/opt/metasploit-framework/bin/msfconsole` to the firewall, but the connection was still blocked. Since Metasploit is written in Ruby, I also added the local Ruby binary - also with no success. A brief research revealed that Metasploit brings its own Ruby binary. The location can be determined by executing `which ruby` in msfconsole. I also added the returned path `/opt/metasploit-framework/embedded/bin/ruby` to the firewall - also with no success. Then I noticed that added binaries are not always retained in the firewall. The Ruby binaries were missing again after closing the `Options` UI. A brief search revealed that the MacOS firewall UI has been buggy for years, and binaries need to be added via the CLI (see https://discussions.apple.com/thread/254361424?sortBy=rank).
The command to add a binary, e.g., here the Ruby binary embedded in Metasploit to the allow-list, is:

```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /opt/metasploit-framework/embedded/bin/ruby
```

Unfortunately, this is not allowed on my managed work laptop and results in the error message Firewall settings cannot be modified from command line on managed Mac computers. On the other hand, it works on the private MacBook, and the binaries are also listed in the firewall UI. Nevertheless, connections to Metasploit continue to be blocked. I have put this attempt on hold for now, as I did not feel that I could solve the problem with it. Disabling the firewall is still not an option for me but could be an alternative for some.

### Attempt 2: Metasploit in Docker
The second idea was to run Metasploit in Docker, as only traffic to Docker needs to be allowed, and the MacOS firewall no longer plays a role within the container.
A quick test showed that the msfconsole reverse shell handler in the Docker container could catch the reverse shell. The firewall did not block the traffic!
However, I wanted to use Metasploit with a home directory and database to access history and stored data. Here's my setup:
Custom Docker Network

Since the database will also run as a container, it must run in the same network as the Metasploit container. This is achieved through a Docker network:

```bash
docker network create --subnet=172.42.0.0/16 metasploit
```

## Metasploit Database
The database (a Postgres) should run in its own container, and the data itself should be stored in a Docker volume.

```bash
docker volume create postgres-msf-data
```

The Docker volume is mounted in the container to the desired location when starting the database.

```bash
docker run \
    --rm \
    --ip 172.42.0.2 \
    --network metasploit \
    --name postgres-msf \
    -v "postgres-msf-data:/var/lib/postgresql/data" \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_DB=msf \
    -d postgres:17-alpine
```

## Metasploit Home Directory
Create a local directory for the Metasploit home, which will later be given to the Docker container as a volume.
You might also be able to use the existing directory in the user directory, but I wanted a separate one for the Docker Metasploit.

```bash
mkdir -p /Users/hueami/metasploit/.msf4
```

## Metasploit Container
The Metasploit container is started with the home directory as volume and the database access as an environment variable.
In my case, I map ports 4444 to 4466 from the host into the container, which I can use for the listeners.

```bash
docker run \
    --rm \
    -it \
    --network metasploit \
    --name msf \
    --ip 172.42.0.3 \
    -e DATABASE_URL='postgres:postgres@172.42.0.2:5432/msf' \
    -v "/Users/hueami/metasploit/.msf4:/home/msf/.msf4" \
    -p 4444-4466:4444-4466 \
    metasploitframework/metasploit-framework
```

## Conclusion
With the Docker setup, I was able to circumvent the problem that the MacOS firewall blocks traffic to Metasploit. This solution works for both my personal and managed MacBooks. I also have a complete Metasploit environment with a home directory and database.