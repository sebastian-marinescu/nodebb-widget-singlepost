<div class="widgetSinglePost">

	<!-- IF postShowTitle -->
	<h2 class="widgetSinglePostTitle">

		<!-- IF postLinkTitle -->
		<a class="widgetSinglePostTitleLink" href="{postUrl}">
		<!-- ENDIF postLinkTitle -->

			{title}

		<!-- IF postLinkTitle -->
		</a>
		<!-- ENDIF postLinkTitle -->

	</h2>
	<!-- ENDIF postShowTitle -->

	<!-- BEGIN posts -->
	<!-- IF @first -->

	<div class="post-header">
		<a class="pull-left visible-xs user-profile-link" href="{config.relative_path}/user/{posts.user.userslug}">
			<!-- IF posts.user.picture -->
			<img class="post-user-picture" src="{posts.user.picture}" alt="{posts.user.username}" title="{posts.user.username}"/>
			<!-- ELSE -->
			<div class="user-icon post-user-picture" style="background-color: {posts.user.icon:bgColor};">{posts.user.icon:text}</div>
			<!-- ENDIF posts.user.picture -->
		</a>

		<strong>
			<a href="<!-- IF posts.user.userslug -->{config.relative_path}/user/{posts.user.userslug}<!-- ELSE -->#<!-- ENDIF posts.user.userslug -->" itemprop="author" data-username="{posts.user.username}" data-uid="{posts.user.uid}">{posts.user.username}</a>
		</strong>
		<!-- IMPORT partials/topic/badge.tpl -->
		<span class="post-time">
			<a class="permalink" href="{config.relative_path}/post/{posts.pid}"><span class="timeago" title="{posts.timestampISO}"></span></a>
		</span>
	</div>

	<br>

	<span class="widgetSinglePostContent">
	{posts.content}
	</span>
	<!-- ENDIF @first -->
	<!-- END posts -->
</div>

