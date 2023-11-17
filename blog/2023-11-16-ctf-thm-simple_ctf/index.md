---
slug: simplectf
title: Simple CTF
authors: [hueami]
tags: [tryhackme, ctf, metasploit]
comments: true
---

## Simple CTF Write-Up
Hello everyone, welcome to another write-up of a TryHackMe room. Today, I will show you how I solved the Simple CTF room, which is a beginner-friendly challenge that covers some basic concepts and tools of ethical hacking. Let’s get started!

### Reconnaissance
The first step is to perform reconnaissance on the target machine and find out what ports and services are running on it. We canuse `nmap` for this task. I ran the following command to scan all ports without trying to obtain further information, because this is much faster. Based on the result I could then run a more advanced scan only against the ports I am interested in.

```bash
nmap 10.10.227.55 -p0-
```

With the scan results we can answer questions 1 and 2.

To answer the third question, which exploit to use, we need more information.

### Web Enumeration
I opened the target machine in the browser but I only got an Apache2 Ubuntu Default Page.

To uncover hidden directories, we can use a tool for bruteforcing firectories. I used feroxbuster and a directory wordlist from [SecLists](https://github.com/danielmiessler/SecLists).

```bash
feroxbuster -u http://10.10.227.55 -w ~/wordlists/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt
```

Success! feroxbuster revealed a directory, which turned out to be a default page of a CMS called CMS Made Simple. The version of the CMS was conveniently located at the bottom of the page, which was 2.2.8. Time to dig deeper! 

### Finding the Right Exploit
With the CMS version in hand, we can to [exploit-db](https://www.exploit-db.com/) to find potential exploits. After some filtering and a bit of trial and error, I found the right exploit, which also provided the answer to question four about the type of vulnerability.

### Cracking the Code
Next, we can execute the exploit script, which is written in Python. If you’re missing any modules for execution, you can install them with `pip install <module_name>`. I also provided a wordlist for cracking the password, which appeared to be stored in the CMS DB as a salted hash.

The script successfully obtained a user, a salt, and a hash. However, it didn’t crack the hash, so I turned to hashcat to finish the job. I identified the hash type as md5 using the [hash identifier on hashes.com](https://hashes.com/en/tools/hash_identifier). The hash type is given to hascat with the `-m` parameter. You get the mode to a given hash type in the hashcat help or [wiki](https://hashcat.net/wiki/doku.php?id=hashcat). The parameter `-a 0` tells hascat to use a dictionary attack. 

`hashcat -m 20 -a 0 <salt:hash> ./wordlists/rockyou.txt`

With hashcat, I were able to crack the password and answer question five.

### Gaining Access and User Flag
With the user and password we are able to login on the machine via ssh.

I also wanted to try another method to access to the machine, so I checked in Metasploit for any exploits available for the CMS. I found three potential authenticated RCE exploits and decided to use the one with the excellent ranking. If you want to learn about metasploit I recommend the [metasploit module](https://tryhackme.com/module/metasploit) which is very comprihensive.

After setting all the options, I ran the exploit and gained a meterpreter session. To access the user’s home directory, I switched from meterpreter to a shell with `shell` and upgraded it to bash with `SHELL=/bin/bash script -q /dev/null`. I switched the user and was able to read the user flag in his home directory and answer question seven.

Question eight was straightforward and can be answered by listing the content of the `\home` directory.

### Privilege Escalation and Root Flag
Our next task is to obtain the root flag. But first, we must escalate our privileges to root. A quick check with `sudo -l` reveals that our current user has the ability to use `vim` with root permissions.

A visit to [gtfobins](https://gtfobins.github.io/gtfobins/vim/#sudo) provides us with the knowledge to leverage vim to escalate our privileges. I chose to spawn a bash shell, as we already know it’s available on the system.

```bash
sudo vim -c ':!/bin/bash'
```

With our newly gained root privileges, we can now read the root flag located in /root, thereby answering question nine.

### Wrapping Up
And there you have it - a step-by-step walkthrough of the Simple CTF room on TryHackMe. The room proved to be relatively straightforward, so we went the extra mile and used Metasploit to gain access to the machine. I hope this guide has been informative and helpful. Keep exploring, keep learning, and most importantly, keep hacking! Until next time, happy hacking! 😊