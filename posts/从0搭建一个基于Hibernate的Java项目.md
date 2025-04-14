---
title: 从0搭建一个基于Hibernate的Java项目  
key: 1591887287date: 2020-06-11 22:54:47  
updated: 2023-02-13 18:28:44
tags: 
 - Java
---


# 前言

说实话，老师拿着18年的视频19年来讲  
确实有点别扭  
还用着废弃的方法…  
~~小声的吐槽下~~

<!-- more -->

# 工具

* IntelliJ IDEA 2019.02
* Hibernate 5.4.8
> Hibernate 官网下载地址 [传送起飞](https://hibernate.org/orm/releases/5.4/)

PS：拉到下面就可以看到下载项了，不过网有点卡…

![](https://i.loli.net/2019/10/29/JqOz4jeI5b8HXxV.png)

所以想了想传到网盘了，网速不行的话试试百度网盘  
[百度网盘 提取码：yxnb](https://pan.baidu.com/s/13rfVOAUeum25y8V3q8_lsg)

# 新建一个Java项目

首先 左上角 File -> New -> Project

![](https://i.loli.net/2019/10/29/UVTxRJmvfNZstyQ.png)

然后一直next最后点finish就行了

# 导入Jar包

找到我们先前下载的Hibernate的压缩包，需要引入的包在
`hibernate-release-5.4.8.Final\lib\required`  

我们先建一个lib的文件夹并把它设置为jar的文件夹

![](https://i.loli.net/2019/10/29/joSW9BNFC5a6v4h.png)

详细的细节可以参考 从0搭建一个基于Struts2的web项目  
这里就不啰嗦了，步骤都是一样的

导入后目录是这样的

![](https://i.loli.net/2019/10/29/NMC6kzLTAdprUSO.png)

# 使用

为了简单使用Hibernate的话需要一个POJO类
所以我们建一个Person类作为实体类
建立一个Hibernate01来测试代码  

建立一个实体类就需要一个`类名.hbm.xml`的配置文件  s
整个项目需要一个`hibernate.cfg.xml`的配置文件，位于`src/`下
都弄完之后差不多就是下面这样子

![](https://i.loli.net/2019/10/29/LvBWdcEJrGwq5Ym.png)

## 类的映射文件编写

### 编写Person类

这个可以随便写写，不一定要和我一样的  

```java
package design.hibernate.pojo;

/**
 * @author 16076
 */
public class Person {

    private int id;
    private String username;
    private byte age;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public byte getAge() {
        return age;
    }

    public void setAge(byte age) {
        this.age = age;
    }

    @Override
    public String toString() {
        return "Person{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", age=" + age +
                '}';
    }
}
```

### 编写Person.hbm.xml

一打开，很蒙，XML约束都没有，不过无妨  
还记得我们下载的压缩包吗？打开  
`hibernate-release-5.4.8.Final\project`  
然后搜索 `.hbm.xml`  
就能看到很多hbm.xml的文件了  
我们随便打开一个  

```xml
<?xml version="1.0"?>
<!DOCTYPE hibernate-mapping PUBLIC
	"-//Hibernate/Hibernate Mapping DTD 3.0//EN"
	"http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping default-lazy="false">
    <class name="org.hibernate.test.legacy.Custom" persister="org.hibernate.test.legacy.CustomPersister">
        <id type="string" name="id" column="id_" length="64" unsaved-value="null" access="field">
            <generator class="uuid.hex"/>
        </id>
        <property name="name"/>
    </class>
</hibernate-mapping>
```

把一些不需要的无关的删掉
保留我们需要的  

```xml
<?xml version="1.0"?>
<!DOCTYPE hibernate-mapping PUBLIC
	"-//Hibernate/Hibernate Mapping DTD 3.0//EN"
	"http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class>
    </class>
</hibernate-mapping>
```

根据我们的类来编写xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <!-- 这里的name配置类的路径 -->
    <class name="design.hibernate.pojo.Person">
        <!-- id标签配置的是对象的唯一标识，对应数据库中的主键 -->
        <!-- name对应类中的属性 -->
        <!-- type对应属性的类型 -->
        <id name="id" type="int">
            <!-- 这里的generator是主键生成策略 -->
            <!-- 我用的MySQL，所以选用identity，意思是使用MySQL的主键生成器 -->
            <generator class="identity"/>
        </id>
        <!-- property配置其他的属性 -->
        <property name="username" type="string" length="50"/>
        <property name="age" type="byte"/>
    </class>
</hibernate-mapping>
```

## 根配置文件编写

```xml
<?xml version='1.0' encoding='utf-8'?>
<!DOCTYPE hibernate-configuration PUBLIC
        "-//Hibernate/Hibernate Configuration DTD//EN"
        "http://www.hibernate.org/dtd/hibernate-configuration-3.0.dtd">
<hibernate-configuration>
    <session-factory>
        <!-- 设置数据库连接属性 -->
        <property name="hibernate.connection.driver_class">com.mysql.jdbc.Driver</property>
        <property name="hibernate.connection.url">jdbc:mysql://localhost:3306/hibernate</property>
        <property name="hibernate.connection.username">root</property>
        <property name="hibernate.connection.password">root</property>
        <!-- 设置Mysql8的方言 -->
        <property name="hibernate.dialect">org.hibernate.dialect.MySQL8Dialect</property>
        <!-- 显示Sql语句 -->
        <property name="hibernate.show_sql">true</property>
        <!-- 设置每次生成数据库，如果原来存在同名的数据库，就删除原来的数据库，再新建一个 -->
        <property name="hibernate.hbm2ddl.auto">create</property>
        <!-- 格式化SQL语句 -->
        <property name="hibernate.format_sql">true</property>
        <!-- 设置事务不自动提交 -->
        <property name="hibernate.connection.autocommit">false</property>

        <!-- 加载映射文件,这里的分隔符不能用'.',必须用'/' -->
        <mapping resource="design/hibernate/pojo/Person.hbm.xml"/>
    </session-factory>
</hibernate-configuration>
```

到这里我们的文件基本就都搞定了
接下来可以写一个类来测试下  

## 测试Hibernate

编写一个Hibernate01的类

```java
package design.hibernate.test;

import design.hibernate.pojo.Person;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.hibernate.cfg.Configuration;

/**
 * @author 16076
 */
public class Hibernate01 {
    public static void main(String[] args) {
        // 加载配置文件，默认为根目录下面的src下的hibernate.cfg.xml
        Configuration configuration = new Configuration().configure();
        // 根据配置文件得到一个session工厂，工厂用来得到session对象
        SessionFactory sessionFactory = configuration.buildSessionFactory();
        // 获取session对象
        Session session = sessionFactory.openSession();

        // 新建一个对象
        Person person = new Person();
        // 设置属性
        person.setUsername("lwf");
        person.setAge((byte) 11);

        // 开启事务
        Transaction transaction = session.beginTransaction();
        // 保存这个对象
        session.save(person);
        // 事务提交
        transaction.rollback();
        // 打印这个对象
        System.out.println(person);
    }
}
```

运行之后  
我们可以看到  
Hibernate判断是否存在表，存在就删除

![](https://i.loli.net/2019/10/29/u3klnGPDNRtX5rI.png)

然后Hibernate建立Person表

![](https://i.loli.net/2019/10/29/A25qFJeb7RPLNgO.png)

根据代码Hibernate插入一条数据

![](https://i.loli.net/2019/10/29/g9rNshPc457oDeL.png)  

# 后记

全程没有使用到SQL，舒服的一塌糊涂  
~~但是我喜欢MyBatis~~  
之前也就视频学过一些  
没有深入地学这个东西  
学还是要学的  
万一要用到呢 …