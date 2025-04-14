---
title: Hibernate中的一对一映射  
key: 1591888402date: 2020-06-11 23:13:22  
updated: 2023-02-13 18:28:44
tags:
- Java
- Hibernate
categories:
- 编程
---


# 前言

上课很容易走神…  
emmm…  
老师讲的注解的  
那我就讲讲XML配置吧  
可能讲的有错误  
希望大佬能指正！感激不尽

<!-- more -->

# 准备

创建一个有Hibernate环境的Java项目 这个可以看之前的帖子 从0搭建一个基于Hibernate的Java项目

# 两种一对一映射方式

一对一其实也可以不用拆表在一个表内进行操作 至于为什么要拆，我个人觉得可能是为了垂直分表？

## 主键一对一

主键一对一，可以理解为一个表的主键同时也是外键，这个外键对应着另一个表的主键 这里我们用User和Address来做例子 一个User对应一个Address 一个Address对应一个User

User类

```java
public class User {
    private int id;
    private String name;
    // 对应的地址对象
    private Address address;
    // ...省略getter、setter和toString方法
}
```

User类对应的User.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="User">
        <id name="id">
            <generator class="native"/>
        </id>
        <property name="name"/>
        <!-- 设置一对一的属性 -->
        <one-to-one name="address"/>
    </class>
</hibernate-mapping>
```

Address类

```java
public class Address {
    private int id;
    // 省
    private String province;
    // 市
    private String city;
    // 对应的用户对象
    private User user;
    // ...省略getter、setter和toString方法
}
```

Address类的Address.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="Address">
        <id name="id">
            <!-- 设置通过外键生成主键 -->
            <generator class="foreign">
                <!-- 设置通过user属性来获取关联表的主键来作为主键 -->
                <param name="property">user</param>
            </generator>
        </id>
        <property name="province"/>
        <property name="city"/>
        <!-- 
            @constrained：表示这个表的主键同时也是外键
         -->
        <one-to-one name="user" constrained="true"/>
    </class>
</hibernate-mapping>
```

然后我们写个测试类来测试

```java
public class HibernateTest {

    @Test
    public void test01() {
        Session session = SessionUtil.getSession();
        // 开启事务
        Transaction transaction = session.beginTransaction();
        // new一个新用户
        User user = new User();
        user.setName("lwf");
        // new一个新地址
        Address address = new Address();
        address.setProvince("广东");
        address.setCity("广州");
        // 设置用户的地址
        address.setUser(user);
        // 保存用户
        session.save(user);
        // 保存地址
        session.save(address);
        // 提交事务
        transaction.commit();
        // 关闭连接
        session.close();
        // 关闭连接工厂
        SessionUtil.close();
    }
}
```

运行之后，就可以看到数据库新增的记录

user表

![](https://i.loli.net/2019/11/05/Mt5IoXHyGn6xASh.png)

address表

![](https://i.loli.net/2019/11/05/VszCFE9LtRmy5MI.png)

address表里面的外键

![](https://i.loli.net/2019/11/05/odphIC4bXteuTO5.png)

**PS：**

* 注意点1：

```java
public class HibernateTest {
    @Test
    public void test01() {
        // ... 省略部分代码
        address.setUser(user);
        // ... 省略部分代码
    }
}
```

这里可能有人会问为什么是
`address.setUser(user)` 而不是
`user.setAddress(address)`

其实我们是在address设置的外键指向user 当我们希望插入新的一个address对象的时候 肯定需要从user获取他的主键值来作为address的主键 如果是 `user.setAddress(address)` 的话
address对象其实是没有对user的引用的 插入的时候自然找不到user对象便报错

报错信息
`org.hibernate.id.IdentifierGenerationException: attempted to assign id from null one-to-one property [pojo.Address.user]`
翻译过来就是尝试从一个空属性(user对象)中获取id(主键)属性

## 利用多对一实现一对一

上面是利用其他表的主键作为自己的主键 多对一实现的一对一就是将自己的主键映射到另一个表的普通字段

还是用上面User和Address来作例子 User类

```java
public class User {
    private int id;
    private String name;
    // 对应的地址对象
    private Address address;
    // ...省略getter、setter和toString方法
}
```

User类对应的User.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="User">
        <id name="id">
            <generator class="native"/>
        </id>
        <property name="name"/>
        <!-- 设置多对一的属性 -->
        <!-- 
            @unique=true 表示我们这一端是唯一的
            @column="address_id" 表示我们对应的表的外键字段。这个外键指向了address的主键
         -->
        <many-to-one name="address" column="address_id" unique="true"/>
    </class>
</hibernate-mapping>
```

Address类

```java
public class Address {
    private int id;
    // 省
    private String province;
    // 市
    private String city;
    // 对应的用户对象
    private User user;
    // ...省略getter、setter和toString方法
}
```

Address类的Address.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="Address">
        <id name="id">
            <generator class="native"/>
        </id>
        <property name="province"/>
        <property name="city"/>
        <!-- 
            @name="user" 表示另一方的属性名
            @property-ref="address" 表示使用被关联的user实体的address字段作为关联字段
                                    默认情况下，关联了user会使用user的主键作为关联字段
                                    有了property-ref，就可以通过它指定被关联实体主键以外的字段作为关联字段。
         -->
        <one-to-one name="user" property-ref="address"/>
    </class>
</hibernate-mapping>
```

老规矩写个测试类来测试

```java
public class HibernateTest {

    @Test
    public void test01() {
        Session session = SessionUtil.getSession();
        Transaction transaction = session.beginTransaction();

        User user = new User();
        user.setName("lwf");

        Address address = new Address();
        address.setProvince("广东省");
        address.setCity("广州市");

        user.setAddress(address);

        session.save(address);
        session.save(user);
        
        transaction.commit();
        session.close();
        SessionUtil.close();
    }
}
```

运行之后

user表

![](https://i.loli.net/2019/11/06/5GBYXHUzJO4axTj.png)

address表

![](https://i.loli.net/2019/11/06/qckPtWIsolNwaV7.png)

user表中的外键

![](https://i.loli.net/2019/11/06/8xNZjYKSkJnP2T6.png)

**PS：**
这里的 `user.setAddress(address)`  同样也不能换成
`address.setUser(user)`
插入user的时候 需要获取address的主键作为外键 没设置的话获取不到 外键又设置为非空的话 就会插入失败

# 后记

感觉只写一对一就可以写很多东西 emmm 要学的还很多 希望能学会吧  