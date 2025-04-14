---
title: Hibernate中的多对多映射  
key: 1591889071date: 2020-06-11 23:24:31  
updated: 2023-02-13 18:28:44
tags: 
 - Java
---


# 前言

写完一对多、多对一
接下来就是多对多 

<!-- more -->

# 准备

创建一个有Hibernate环境的Java项目
这个可以看之前的帖子
不多写  

# 多对多

这里用学生和课程来作例子
一个学生有多个课程
一个课程属于多个学生  

Student类

```java
public class Student {
    private int id;
    private String name;
    private Set<Course> courseSet = new HashSet<>();
    // ...省略getter、setter和toString方法
}
```

Student类对应的Student.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="pojo.Student">
        <id name="id">
            <generator class="native"></generator>
        </id>
        <property name="name"></property>
        <!-- 配置set无序集合 -->
        <!-- table指定中间表 -->
        <!-- inserve="true"表示本方（Student）放弃维护外键，由Cource方维护外键 -->
        <set name="courseSet" table="student_course" inverse="true">
            <!-- 配置本方在中间表的外键，也就是中间表中有student_id列指向student表 -->
            <key column="student_id"></key>
            <!-- 配置集合的所对应的类 -->
            <!-- column="course_id" 表示Cource类在中间表的外键字段名 -->
            <many-to-many class="pojo.Course" column="course_id"></many-to-many>
        </set>
    </class>
</hibernate-mapping>
```

Course类

```java
public class Course{
    private int id;
    private String name;
    private Set<Student> studentSet = new HashSet<>();
    // ...省略getter、setter和toString方法
}
```

Course类对应的Course.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="pojo.Course">
        <id name="id">
            <generator class="native"></generator>
        </id>
        <property name="name"></property>
        <!-- 配置set无序集合 -->
        <!-- table指定中间表 -->
        <set name="studentSet" table="student_course">
            <!-- 配置本方在中间表的外键，也就是中间表中有course_id列指向course表-->
            <key column="course_id"></key>
            <!-- 配置集合的所对应的类 -->
            <!-- column="course_id" 表示Cource类在中间表的外键字段名 -->
            <many-to-many class="pojo.Student" column="student_id"></many-to-many>
        </set>
    </class>
</hibernate-mapping>
```

测试一下

```java
public class HibernateTest {

    @Test
    public void test01() {
        Session session = SessionUtil.getSession();
        Transaction transaction = session.beginTransaction();

        // new两个学生
        Student s1 = new Student();
        s1.setName("s1");
        Student s2 = new Student();
        s2.setName("s2");

        // new两个课程
        Course c1 = new Course();
        c1.setName("c1");
        Course c2 = new Course();
        c2.setName("c2");

        // 设置两个学生分别都对应两个课程
        s1.getCourseSet().add(c1);
        s1.getCourseSet().add(c2);
        s2.getCourseSet().add(c1);
        s2.getCourseSet().add(c2);

        // 设置两个课程分别都属于两个学生
        c1.getStudentSet().add(s1);
        c1.getStudentSet().add(s2);
        c2.getStudentSet().add(s1);
        c2.getStudentSet().add(s2);

        // 保存
        session.save(s1);
        session.save(s2);
        session.save(c1);
        session.save(c2);

        transaction.commit();
        session.close();
        SessionUtil.close();
    }
}
```

运行之后可以看到

course表

![](https://i.loli.net/2019/11/07/KFYIsztZMxkRjX2.png)

student表

![](https://i.loli.net/2019/11/07/kcuoG5YeRIEUSPQ.png)

中间表student_course

![](https://i.loli.net/2019/11/07/o6jAZwkN9visfUS.png)

中间表的外键

![](https://i.loli.net/2019/11/07/1whkeANcLKCPnpI.png)

student_id指向了student表的主键id
course_id指向了course表的主键id
符合了预期的配置  

# 后记

一对一、一对多（多对一）、多对多都写完了  
接下来会写写关于一些重要属性的理解  

~~想看天气之子~~

~~主题曲和片尾曲真的好听~~